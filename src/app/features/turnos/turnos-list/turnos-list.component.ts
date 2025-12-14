import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TurnoService } from '../../../core/services/turno.service';
import { Turno } from '../../../core/interfaces/turno.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { Cliente } from '../../../core/interfaces/cliente.model';

// Interface que extiende Turno con detalles enriquecidos
interface TurnoConDetalles extends Turno {
  pacienteNombre?: string;
  pacienteApellido?: string;
  pacienteEmail?: string;
  responsableNombre?: string;
  responsableEmail?: string;
  responsableTelefono?: string;
  profesionalNombre?: string;
  profesionalEspecialidad?: string;
}

@Component({
  selector: 'app-turnos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos-list.component.html',
  styleUrl: './turnos-list.component.css'
})
export class TurnosListComponent implements OnInit {
  private turnoService = inject(TurnoService);
  private usuarioService = inject(UsuarioService);
  private pacienteService = inject(PacienteService);
  private clienteService = inject(ClienteService);

  // Signals para estado reactivo
  turnos = signal<TurnoConDetalles[]>([]);
  isLoading = signal<boolean>(false);

  // Filters como signals
  fechaDesde = signal<string>('');
  fechaHasta = signal<string>('');
  searchTerm = signal<string>('');

  ngOnInit() {
    this.loadTurnos();
  }

  async loadTurnos(fechaDesde?: string, fechaHasta?: string) {
    this.isLoading.set(true);

    try {
      // Consulta con filtros de fecha en el servidor
      this.turnoService.getTurnosByDateRange(fechaDesde, fechaHasta).subscribe({
        next: async (turnos: Turno[]) => {
          // Enriquecer cada turno con datos completos
          const enrichedPromises = turnos.map(turno => this.enrichTurno(turno));
          const enrichedResults = await Promise.all(enrichedPromises);

          // Filtrar los que no se pudieron enriquecer completamente
          const validTurnos = enrichedResults.filter((t): t is TurnoConDetalles => t !== null);

          // Aplicar filtro de texto si existe
          const filtered = this.searchTerm()
            ? validTurnos.filter(turno => this.matchesSearchTerm(turno, this.searchTerm()))
            : validTurnos;

          this.turnos.set(filtered);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading turnos', err);
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error en loadTurnos:', error);
      this.isLoading.set(false);
    }
  }

  matchesSearchTerm(turno: TurnoConDetalles, search: string): boolean {
    const searchLower = search.toLowerCase();
    return (
      (turno.pacienteNombre?.toLowerCase().includes(searchLower) ?? false) ||
      (turno.responsableNombre?.toLowerCase().includes(searchLower) ?? false) ||
      (turno.profesionalNombre?.toLowerCase().includes(searchLower) ?? false) ||
      turno.motivo.toLowerCase().includes(searchLower) ||
      turno.estado.toLowerCase().includes(searchLower)
    );
  }

  async enrichTurno(turno: Turno): Promise<TurnoConDetalles | null> {
    try {
      const turnoConDetalles: TurnoConDetalles = { ...turno };

      // Obtener datos del paciente
      if (turno.pacienteId) {
        const paciente = await this.pacienteService.getPacienteById(turno.pacienteId);
        if (paciente) {
          turnoConDetalles.pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
          turnoConDetalles.pacienteApellido = paciente.apellido;
        }
      }

      // Obtener datos del responsable (cliente/tutor)
      if (turno.responsableId) {
        const responsable = await this.clienteService.getClienteById(turno.responsableId);
        if (responsable) {
          turnoConDetalles.responsableNombre = `${responsable.nombre} ${responsable.apellido}`;
          turnoConDetalles.responsableEmail = responsable.email;
          turnoConDetalles.responsableTelefono = responsable.telefono || 'N/A';
          turnoConDetalles.pacienteEmail = responsable.email; // El email del paciente viene del responsable
        }
      }

      // Obtener datos del profesional
      if (turno.profesionalId) {
        const profesional = await this.usuarioService.getUsuarioById(turno.profesionalId);
        if (profesional) {
          turnoConDetalles.profesionalNombre = `${profesional.nombre} ${profesional.apellido}`;
          turnoConDetalles.profesionalEspecialidad = profesional.rol === 'Pediatra' ? 'Pediatría' : profesional.rol;
        } else {
          turnoConDetalles.profesionalNombre = 'Sin asignar';
          turnoConDetalles.profesionalEspecialidad = 'N/A';
        }
      } else {
        turnoConDetalles.profesionalNombre = 'Sin asignar';
        turnoConDetalles.profesionalEspecialidad = 'N/A';
      }

      // Si falta información crítica del paciente, retornar null
      if (!turnoConDetalles.pacienteNombre) {
        return null;
      }

      return turnoConDetalles;
    } catch (error) {
      console.error('Error enriqueciendo turno:', turno.id, error);
      return null;
    }
  }

  formatDate(date: Date | any): string {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString('es-AR');
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('es-AR');
    }
    return String(date);
  }

  async search() {
    // Recargar con los filtros actuales
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();

    await this.loadTurnos(desde || undefined, hasta || undefined);
  }

  limpiarFiltros() {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.searchTerm.set('');
    this.loadTurnos();
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmado':
        return 'bg-teal-100 text-teal-800';
      case 'Atendido':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
