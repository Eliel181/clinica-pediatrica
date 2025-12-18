import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TurnoService } from '../../../core/services/turno.service';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { PdfMakeService } from '../../../core/services/pdf-make.service';
import { ClinicaService } from '../../../core/services/clinica.service';
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
  private pdfMakeService = inject(PdfMakeService);
  private clinicaService = inject(ClinicaService);

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

  // Estado de los filtros
  activeFilter = signal<'hoy' | 'semana' | 'mes' | 'custom'>('hoy');
  isCustomRangeVisible = signal<boolean>(false);
  customRangeStart = signal<string>('');
  customRangeEnd = signal<string>('');

  constructor() {
    effect(() => {
      const profesional = this.authService.currentUser();
      if (profesional && profesional.uid) {
        // Inicia la carga por defecto con el filtro 'hoy'
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
      return;
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
        const turnosProfesional = allTurnos.filter(t => t.profesionalId === profesionalId);

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

  async exportarReporte() {
    try {
      // Obtener datos de la clínica
      const clinica = await this.clinicaService.obtnerClinica();

      // Determinar el rango de fechas para el título
      let rangoFechas = '';
      switch (this.activeFilter()) {
        case 'hoy':
          rangoFechas = 'Hoy';
          break;
        case 'semana':
          rangoFechas = 'Esta Semana';
          break;
        case 'mes':
          rangoFechas = 'Este Mes';
          break;
        case 'custom':
          rangoFechas = `${this.customRangeStart()} - ${this.customRangeEnd()}`;
          break;
      }

      // Crear contenido del PDF
      const content: any[] = [];

      // Agregar encabezado de la clínica si existe
      if (clinica) {
        content.push({
          columns: [
            {
              image: clinica.logoBase64,
              width: 60,
              alignment: 'left'
            },
            {
              width: '*',
              stack: [
                {
                  text: clinica.nombre,
                  style: 'clinicName',
                  margin: [0, 0, 0, 4]
                },
                {
                  text: [
                    { text: '📞 ', fontSize: 8 },
                    { text: clinica.telefono, fontSize: 9 },
                    { text: '  |  ', fontSize: 9, color: '#cbd5e1' },
                    { text: '✉️ ', fontSize: 8 },
                    { text: clinica.email, fontSize: 9 }
                  ],
                  color: '#64748b',
                  margin: [0, 0, 0, 2]
                },
                {
                  text: [
                    { text: '📍 ', fontSize: 8 },
                    { text: clinica.direccion, fontSize: 9 }
                  ],
                  color: '#64748b'
                }
              ],
              margin: [15, 0, 0, 0]
            }
          ],
          margin: [0, 0, 0, 15]
        });

        // Línea separadora
        content.push({
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: '#e2e8f0'
            }
          ],
          margin: [0, 0, 0, 20]
        });
      }

      // Título del reporte
      content.push(
        {
          text: `Reporte de Turnos - ${rangoFechas}`,
          style: 'header',
          margin: [0, 10, 0, 5]
        },
        {
          text: `Dr. ${this.authService.currentUser()?.nombre} ${this.authService.currentUser()?.apellido}`,
          fontSize: 12,
          color: '#64748b',
          margin: [0, 0, 0, 20]
        }
      );

      // Agregar tabla si hay turnos
      if (this.turnos().length > 0) {
        const tableBody: any[] = [
          [
            { text: 'Paciente', style: 'tableHeader', fillColor: '#0d9488', color: '#ffffff' },
            { text: 'Edad', style: 'tableHeader', fillColor: '#0d9488', color: '#ffffff', alignment: 'center' },
            { text: 'Fecha', style: 'tableHeader', fillColor: '#0d9488', color: '#ffffff' },
            { text: 'Hora', style: 'tableHeader', fillColor: '#0d9488', color: '#ffffff', alignment: 'center' },
            { text: 'Motivo', style: 'tableHeader', fillColor: '#0d9488', color: '#ffffff' },
            { text: 'Estado', style: 'tableHeader', fillColor: '#0d9488', color: '#ffffff', alignment: 'center' }
          ]
        ];

        this.turnos().forEach((turno, index) => {
          // Color del estado
          let estadoColor = '#64748b';
          let estadoBg = '#f1f5f9';

          switch (turno.estado) {
            case 'Confirmado':
              estadoColor = '#059669';
              estadoBg = '#d1fae5';
              break;
            case 'Pendiente':
              estadoColor = '#d97706';
              estadoBg = '#fef3c7';
              break;
            case 'Atendido':
              estadoColor = '#0d9488';
              estadoBg = '#ccfbf1';
              break;
            case 'Cancelado':
              estadoColor = '#dc2626';
              estadoBg = '#fee2e2';
              break;
          }

          const fillColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';

          tableBody.push([
            {
              text: turno.pacienteNombre || 'N/A',
              fillColor: fillColor,
              margin: [0, 5, 0, 5]
            },
            {
              text: turno.pacienteEdad?.toString() || 'N/A',
              fillColor: fillColor,
              alignment: 'center',
              margin: [0, 5, 0, 5]
            },
            {
              text: this.formatDate(turno.fecha),
              fillColor: fillColor,
              fontSize: 9,
              margin: [0, 5, 0, 5]
            },
            {
              text: turno.hora || 'N/A',
              fillColor: fillColor,
              alignment: 'center',
              margin: [0, 5, 0, 5]
            },
            {
              text: turno.motivo || 'Consulta General',
              fillColor: fillColor,
              fontSize: 9,
              margin: [0, 5, 0, 5]
            },
            {
              text: turno.estado,
              fillColor: estadoBg,
              color: estadoColor,
              bold: true,
              alignment: 'center',
              fontSize: 9,
              margin: [2, 5, 2, 5]
            }
          ]);
        });

        content.push({
          table: {
            headerRows: 1,
            widths: ['*', 40, 'auto', 45, '*', 70],
            body: tableBody
          },
          layout: {
            hLineWidth: (i: number, node: any) => i === 0 || i === 1 ? 0 : 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e2e8f0',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6
          },
          margin: [0, 10, 0, 20]
        });
      } else {
        content.push({
          text: 'No hay turnos para mostrar en este rango de fechas.',
          alignment: 'center',
          color: '#64748b',
          italics: true,
          margin: [0, 40, 0, 40]
        });
      }

      // Generar PDF
      await this.pdfMakeService.generatePdf(
        content,
        `Reporte_Turnos_${rangoFechas}`
      );
    } catch (error) {
      console.error('Error generando reporte PDF:', error);
      alert('Error al generar el reporte. Por favor, intente nuevamente.');
    }
  }
}
