import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TurnoService } from '../../../core/services/turno.service';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Turno } from '../../../core/interfaces/turno.model';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { Cliente } from '../../../core/interfaces/cliente.model';
import { RouterLink, RouterModule } from '@angular/router';

interface TurnoConDetalles extends Turno {
  pacienteNombre?: string;
  pacienteEdad?: number;
  responsableNombre?: string;
  responsableEmail?: string;
  responsableTelefono?: string;
}

@Component({
  selector: 'app-mis-turnos-profesional',
  imports: [CommonModule, RouterLink, RouterModule, FormsModule],
  templateUrl: './mis-turnos-profesional.component.html',
  styleUrl: './mis-turnos-profesional.component.css'
})
export class MisTurnosProfesionalComponent {
  private turnoService = inject(TurnoService);
  authService = inject(AuthService); // Public para acceder en template
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

  turnosHoy = computed(() => {
    const today = new Date();
    return this.turnos().filter(t => {
      if (!t.fecha) return false;
      const turnoDate = typeof t.fecha === 'string' ? new Date(t.fecha) : (t.fecha as any).toDate ? (t.fecha as any).toDate() : new Date(t.fecha);
      return this.isSameDate(turnoDate, today);
    });
  });

  private isSameDate(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  // Filter state
  activeFilter = signal<'hoy' | 'semana' | 'mes' | 'custom'>('hoy');
  isCustomRangeVisible = signal<boolean>(false);
  customRangeStart = signal<string>('');
  customRangeEnd = signal<string>('');

  constructor() {
    effect(() => {
      // Re-trigger load when filter or custom range changes IF we have a user
      // However, to avoid infinite loops or complex effects, 
      // we might just call loadTurnos directly from setFilter for now, 
      // or keep the initial load here.
      // Let's keep the initial load driven by auth, and manual re-loads driven by user action.
      // But actually, we want the initial load to respect the default 'hoy' filter.

      const profesional = this.authService.currentUser();
      if (profesional && profesional.uid) {
        // Initial load with default filter 'hoy'
        this.setFilter('hoy');
      } else {
        this.loading.set(false);
      }
    }, { allowSignalWrites: true });
  }

  setFilter(filter: 'hoy' | 'semana' | 'mes' | 'custom') {
    this.activeFilter.set(filter);

    if (filter === 'custom') {
      this.isCustomRangeVisible.set(!this.isCustomRangeVisible());
      return; // Wait for user to select dates and click apply
    } else {
      this.isCustomRangeVisible.set(false);
    }

    const { start, end } = this.calculateDateRange(filter);
    const profesional = this.authService.currentUser();
    if (profesional?.uid) {
      this.loadTurnos(profesional.uid, start, end);
    }
  }

  applyCustomFilter(start: string, end: string) {
    if (!start || !end) return;
    this.customRangeStart.set(start);
    this.customRangeEnd.set(end);

    const profesional = this.authService.currentUser();
    if (profesional?.uid) {
      this.loadTurnos(profesional.uid, start, end);
    }
  }

  private calculateDateRange(filter: 'hoy' | 'semana' | 'mes'): { start: string, end: string } {
    const today = new Date();
    let start = new Date(today);
    let end = new Date(today);

    switch (filter) {
      case 'hoy':
        // Start and end are today
        break;
      case 'semana':
        // Monday to Sunday of current week
        const day = today.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start = new Date(today.setDate(diff));
        end = new Date(today.setDate(start.getDate() + 6));
        break;
      case 'mes':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  private loadTurnos(profesionalId: string, fechaDesde?: string, fechaHasta?: string): void {
    this.loading.set(true);

    this.turnoService.getTurnosByDateRange(fechaDesde, fechaHasta).subscribe({
      next: async (allTurnos) => {
        // Filtrar turnos del profesional (server side filtering for date, but client side for professional ID 
        // because the service returns all turnos in date range currently, then we filter by ID here. 
        // Ideally service should do compound query, but this works for now).
        const turnosProfesional = allTurnos.filter(t => t.profesionalId === profesionalId);

        // Load details for each turno
        const turnosConDetalles = await Promise.all(
          turnosProfesional.map(async (turno) => {
            // 1. Normalize Date Object immediately
            let fechaNormalized: Date;
            if (turno.fecha && (turno.fecha as any).toDate) {
              fechaNormalized = (turno.fecha as any).toDate();
            } else if (typeof turno.fecha === 'string') {
              fechaNormalized = new Date(turno.fecha);
            } else {
              fechaNormalized = new Date(turno.fecha);
            }

            const turnoConDetalles: TurnoConDetalles = {
              ...turno,
              fecha: fechaNormalized // Replace with real Date object
            };

            // 2. Load patient details
            if (turno.pacienteId) {
              try {
                const paciente = await this.firestoreService.getDocument<Paciente>('pacientes', turno.pacienteId);
                if (paciente) {
                  turnoConDetalles.pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
                  turnoConDetalles.pacienteEdad = this.calculateAge(paciente.fechaNacimiento);
                } else {
                  turnoConDetalles.pacienteNombre = 'Paciente no encontrado';
                }
              } catch (error) {
                console.error('Error loading patient:', error);
                turnoConDetalles.pacienteNombre = 'Error cargando paciente';
              }
            }

            // 3. Load responsable (cliente) details
            if (turno.responsableId) {
              try {
                const responsable = await this.firestoreService.getDocument<Cliente>('clientes', turno.responsableId);
                if (responsable) {
                  turnoConDetalles.responsableNombre = `${responsable.nombre} ${responsable.apellido}`;
                  turnoConDetalles.responsableEmail = responsable.email;
                  turnoConDetalles.responsableTelefono = responsable.telefono || 'N/A';
                }
              } catch (error) {
                console.error('Error loading responsable:', error);
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

  private calculateAge(fechaNacimiento: any): number {
    if (!fechaNacimiento) return 0;

    const today = new Date();
    let birthDate: Date;

    if (typeof fechaNacimiento === 'string') {
      birthDate = new Date(fechaNacimiento);
    } else if (fechaNacimiento?.toDate) {
      birthDate = fechaNacimiento.toDate();
    } else {
      birthDate = new Date(fechaNacimiento);
    }

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

  formatDate(fecha: Date | string | any): string {
    // Robust parsing just in case
    let date: Date;
    if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else if (fecha?.toDate) {
      date = fecha.toDate();
    } else {
      date = fecha;
    }

    if (!date || isNaN(date.getTime())) return 'Fecha inválida';

    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(hora: string): string {
    return hora || 'N/A';
  }

  getTurnosConfirmados(): number {
    return this.turnos().filter(t => t.estado === 'Confirmado').length;
  }

  getTurnosPendientes(): number {
    return this.turnos().filter(t => t.estado === 'Pendiente').length;
  }

  getTurnosAtendidos(): number {
    return this.turnos().filter(t => t.estado === 'Atendido').length;
  }
}
