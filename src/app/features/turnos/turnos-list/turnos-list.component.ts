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

// Interface para turnos enriquecidos con datos completos
interface TurnoEnriquecido {
  id: string;
  paciente: {
    nombre: string;
    apellido: string;
    email?: string;
  };
  responsable: {
    nombre: string;
    email: string;
    telefono: string;
  };
  doctor: {
    nombre: string;
    especialidad: string;
  };
  fecha: string;
  hora: string;
  estado: string;
  motivo: string;
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
  turnos = signal<TurnoEnriquecido[]>([]);
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
          const validTurnos = enrichedResults.filter((t): t is TurnoEnriquecido => t !== null);

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

  matchesSearchTerm(turno: TurnoEnriquecido, search: string): boolean {
    const searchLower = search.toLowerCase();
    return (
      turno.paciente.nombre.toLowerCase().includes(searchLower) ||
      turno.responsable.nombre.toLowerCase().includes(searchLower) ||
      turno.doctor.nombre.toLowerCase().includes(searchLower) ||
      turno.motivo.toLowerCase().includes(searchLower) ||
      turno.estado.toLowerCase().includes(searchLower)
    );
  }

  async enrichTurno(turno: Turno): Promise<TurnoEnriquecido | null> {
    try {
      // Obtener datos del paciente
      const paciente = turno.pacienteId
        ? await this.pacienteService.getPacienteById(turno.pacienteId)
        : null;

      // Obtener datos del responsable (cliente/tutor)
      const responsable = turno.responsableId
        ? await this.clienteService.getClienteById(turno.responsableId)
        : null;

      // Obtener datos del profesional
      const profesional = turno.profesionalId
        ? await this.usuarioService.getUsuarioById(turno.profesionalId)
        : null;

      // Si falta información crítica, retornar null
      if (!paciente || !responsable) {
        return null;
      }

      // Construir objeto enriquecido
      const enriquecido: TurnoEnriquecido = {
        id: turno.id,
        paciente: {
          nombre: `${paciente.nombre} ${paciente.apellido}`,
          apellido: paciente.apellido,
          email: responsable.email
        },
        responsable: {
          nombre: `${responsable.nombre} ${responsable.apellido}`,
          email: responsable.email,
          telefono: responsable.telefono || 'N/A'
        },
        doctor: {
          nombre: profesional ? `${profesional.nombre} ${profesional.apellido}` : 'Sin asignar',
          especialidad: profesional?.rol === 'Pediatra' ? 'Pediatría' : profesional?.rol || 'N/A'
        },
        fecha: turno.fechaString || this.formatDate(turno.fecha),
        hora: turno.horaString || turno.hora,
        estado: turno.estado,
        motivo: turno.motivo
      };

      return enriquecido;
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
}
