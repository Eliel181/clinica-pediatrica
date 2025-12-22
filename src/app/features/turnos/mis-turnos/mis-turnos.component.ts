import { Component, computed, effect, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnoService } from '../../../core/services/turno.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Turno } from '../../../core/interfaces/turno.model';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';

interface TurnoConDetalles extends Turno {
  pacienteNombre?: string;
  pacienteEdad?: number;
  profesionalNombre?: string;
  profesionalImagen?: string;
}

@Component({
  selector: 'app-mis-turnos',
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent {
  private turnoService = inject(TurnoService);
  private clienteService = inject(ClienteService);
  private firestoreService = inject(FirestoreService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  // Signals
  turnos = signal<TurnoConDetalles[]>([]);
  loading = signal<boolean>(true);

  // Cache for professionals and patients to avoid redundant requests
  private professionalsCache = new Map<string, Usuario>();
  private patientsCache = new Map<string, Paciente>();

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

  // Computed signals for stats
  turnosConfirmadosCount = computed(() => {
    return this.turnosActivos().filter(t => t.estado === 'Confirmado').length;
  });

  turnosPendientesCount = computed(() => {
    return this.turnosActivos().filter(t => t.estado === 'Pendiente').length;
  });

  // Computed signals for filtered lists
  turnosPendientes = computed(() => {
    return this.turnosActivos().filter(t => t.estado === 'Pendiente');
  });

  turnosConfirmados = computed(() => {
    return this.turnosActivos().filter(t => t.estado === 'Confirmado');
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
        // Load details for each turno in parallel for better performance
        const turnosConDetalles = await Promise.all(
          turnos.map(async (turno) => {
            const turnoConDetalles: TurnoConDetalles = {
              ...turno,
              // Convert Firestore Timestamp to Date
              fecha: turno.fecha instanceof Date ? turno.fecha : (turno.fecha as any).toDate(),
              createdAt: turno.createdAt instanceof Date ? turno.createdAt : (turno.createdAt as any).toDate()
            };

            // Load patient details with cache
            try {
              let paciente = this.patientsCache.get(turno.pacienteId);
              if (!paciente) {
                paciente = await this.firestoreService.getDocument<Paciente>('pacientes', turno.pacienteId);
                if (paciente) {
                  this.patientsCache.set(turno.pacienteId, paciente);
                }
              }
              if (paciente) {
                turnoConDetalles.pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
                turnoConDetalles.pacienteEdad = this.calculateAge(paciente.fechaNacimiento);
              }
            } catch (error) {
              console.error('Error loading patient:', error);
            }

            // Load professional details with cache
            if (turno.profesionalId) {
              try {
                let profesional = this.professionalsCache.get(turno.profesionalId);
                if (!profesional) {
                  profesional = await this.firestoreService.getDocument<Usuario>('usuarios', turno.profesionalId);
                  if (profesional) {
                    this.professionalsCache.set(turno.profesionalId, profesional);
                  }
                }
                if (profesional) {
                  turnoConDetalles.profesionalNombre = `${profesional.nombre} ${profesional.apellido}`;
                  turnoConDetalles.profesionalImagen = profesional.imagenBase64;
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
        this.cdr.detectChanges(); // Force change detection to update UI immediately
      },
      error: (error) => {
        console.error('Error loading turnos:', error);
        this.loading.set(false);
      }
    });
  }

  async cancelarTurno(turnoId: string): Promise<void> {
    const result = await this.alertService.open({
      title: 'Cancelar Turno',
      message: '¿Estás seguro que deseas cancelar este turno?',
      type: 'info',
    });

    if (result) {
      this.turnoService.cancelarTurno(turnoId).then(() => {
        this.alertService.open({
          title: 'Turno cancelado',
          message: 'El turno ha sido cancelado correctamente.',
          type: 'success',
        });
      }).catch((error) => {
        this.alertService.open({
          title: 'Error al cancelar el turno',
          message: 'Hubo un error al cancelar el turno.',
          type: 'error',
        });
      });
    }
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
