import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnoService } from '../../../core/services/turno.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Turno } from '../../../core/interfaces/turno.model';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { Usuario } from '../../../core/interfaces/usuario.model';

interface TurnoConDetalles extends Turno {
  pacienteNombre?: string;
  pacienteEdad?: number;
  profesionalNombre?: string;
}

@Component({
  selector: 'app-mis-turnos',
  imports: [CommonModule],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent {
  private turnoService = inject(TurnoService);
  private clienteService = inject(ClienteService);
  private firestoreService = inject(FirestoreService);

  // Signals
  turnos = signal<TurnoConDetalles[]>([]);
  loading = signal<boolean>(true);

  // Computed signals for filtering
  turnosActivos = computed(() => {
    return this.turnos().filter(t =>
      t.estado === 'Pendiente' || t.estado === 'Confirmado'
    );
  });

  turnosFinalizados = computed(() => {
    return this.turnos().filter(t =>
      t.estado === 'Atendido' || t.estado === 'Cancelado'
    );
  });

  constructor() {
    effect(() => {
      const cliente = this.clienteService.currentClient();
      if (cliente && cliente.id) {
        this.loadTurnos(cliente.id);
      } else {
        this.loading.set(false);
      }
    });
  }

  private loadTurnos(clienteId: string): void {
    this.loading.set(true);

    this.turnoService.getTurnosByClienteId(clienteId).subscribe({
      next: async (turnos) => {
        // Load details for each turno
        const turnosConDetalles = await Promise.all(
          turnos.map(async (turno) => {
            const turnoConDetalles: TurnoConDetalles = { ...turno };

            // Load patient details
            try {
              const paciente = await this.firestoreService.getDocument<Paciente>('pacientes', turno.pacienteId);
              if (paciente) {
                turnoConDetalles.pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
                turnoConDetalles.pacienteEdad = this.calculateAge(paciente.fechaNacimiento);
              }
            } catch (error) {
              console.error('Error loading patient:', error);
            }

            // Load professional details
            if (turno.profesionalId) {
              try {
                const profesional = await this.firestoreService.getDocument<Usuario>('usuarios', turno.profesionalId);
                if (profesional) {
                  turnoConDetalles.profesionalNombre = `Dr. ${profesional.nombre} ${profesional.apellido}`;
                }
              } catch (error) {
                console.error('Error loading professional:', error);
              }
            }

            return turnoConDetalles;
          })
        );

        this.turnos.set(turnosConDetalles);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading turnos:', error);
        this.loading.set(false);
      }
    });
  }

  private calculateAge(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

  formatDate(fecha: Date | string): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
