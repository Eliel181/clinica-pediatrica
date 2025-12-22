import { Component, ViewChild, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent, ApexChart, ApexXAxis, ApexYAxis, ApexDataLabels, ApexStroke, ApexGrid, ApexTooltip, ApexFill } from 'ng-apexcharts';
import { TurnoService } from '../../core/services/turno.service';
import { Turno } from '../../core/interfaces/turno.model';
import { PacienteService } from '../../core/services/paciente.service';
import { Paciente } from '../../core/interfaces/paciente.model';
import { forkJoin } from 'rxjs';

export type ChartOptions = {
  series: any[];
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  fill: ApexFill;
  colors: string[];
};

type TimePeriod = 'week' | 'month' | 'year';

interface TurnoConPaciente extends Turno {
  pacienteNombre?: string;
  pacienteApellido?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;

  private turnoService = inject(TurnoService);
  private pacienteService = inject(PacienteService);

  selectedPeriod = signal<TimePeriod>('week');
  public chartOptions = signal<Partial<ChartOptions>>({});
  private allTurnos: Turno[] = [];

  // Citas recientes con datos del paciente
  recentAppointments = signal<TurnoConPaciente[]>([]);

  ngOnInit(): void {
    this.loadTurnos();
  }

  private loadTurnos(): void {
    this.turnoService.getAllTurnos().subscribe({
      next: (turnos) => {
        this.allTurnos = turnos.filter(t => t.estado !== 'Cancelado');
        this.updateChart(this.selectedPeriod());
        this.loadRecentAppointments(turnos);
      },
      error: (error) => {
        console.error('Error cargando turnos:', error);
        this.updateChart(this.selectedPeriod());
      }
    });
  }

  private loadRecentAppointments(turnos: Turno[]): void {
    // Ordenar por createdAt descendente y tomar los últimos 4
    const recentTurnos = turnos
      .filter(t => t.estado !== 'Cancelado')
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any).toDate();
        const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any).toDate();
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 4);

    // Cargar datos de pacientes para cada turno
    if (recentTurnos.length === 0) {
      this.recentAppointments.set([]);
      return;
    }

    const pacienteRequests = recentTurnos.map(turno =>
      this.pacienteService.getPacienteById(turno.pacienteId)
    );

    forkJoin(pacienteRequests).subscribe({
      next: (pacientes) => {
        const turnosConPaciente: TurnoConPaciente[] = recentTurnos.map((turno, index) => {
          const paciente = pacientes[index];
          return {
            ...turno,
            pacienteNombre: paciente?.nombre,
            pacienteApellido: paciente?.apellido
          };
        });
        this.recentAppointments.set(turnosConPaciente);
      },
      error: (error) => {
        console.error('Error cargando pacientes:', error);
        this.recentAppointments.set(recentTurnos);
      }
    });
  }

  getInitials(nombre?: string, apellido?: string): string {
    if (!nombre && !apellido) return '??';
    const n = nombre?.charAt(0).toUpperCase() || '';
    const a = apellido?.charAt(0).toUpperCase() || '';
    return n + a;
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Confirmado':
        return 'bg-green-500';
      case 'Pendiente':
        return 'bg-yellow-500';
      case 'Atendido':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  }

  getAvatarColor(index: number): string {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-pink-100 text-pink-600',
      'bg-purple-100 text-purple-600',
      'bg-orange-100 text-orange-600'
    ];
    return colors[index % colors.length];
  }

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const period = select.value as TimePeriod;
    this.selectedPeriod.set(period);
    this.updateChart(period);
  }

  private updateChart(period: TimePeriod): void {
    let data: { categories: string[], data: number[] };

    switch (period) {
      case 'week':
        data = this.getWeekData();
        break;
      case 'month':
        data = this.getMonthData();
        break;
      case 'year':
        data = this.getYearData();
        break;
      default:
        data = this.getWeekData();
    }

    this.chartOptions.set({
      series: [
        {
          name: "Pacientes",
          data: data.data
        }
      ],
      chart: {
        type: "area",
        height: 300,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      colors: ["#0d9488"],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 3
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: data.categories,
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '12px',
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 600
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '12px',
            fontFamily: 'Outfit, sans-serif'
          }
        }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: false
          }
        }
      },
      tooltip: {
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif'
        },
        y: {
          formatter: function (val: number) {
            return val + " pacientes";
          }
        }
      }
    });
  }

  private getWeekData(): { categories: string[], data: number[] } {
    const categories = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const data = [0, 0, 0, 0, 0, 0, 0];

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes
    startOfWeek.setHours(0, 0, 0, 0);

    this.allTurnos.forEach(turno => {
      const turnoDate = turno.fecha instanceof Date ? turno.fecha : (turno.fecha as any).toDate();
      const daysDiff = Math.floor((turnoDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 0 && daysDiff < 7) {
        data[daysDiff]++;
      }
    });

    return { categories, data };
  }

  private getMonthData(): { categories: string[], data: number[] } {
    const categories = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const data = [0, 0, 0, 0];

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    this.allTurnos.forEach(turno => {
      const turnoDate = turno.fecha instanceof Date ? turno.fecha : (turno.fecha as any).toDate();

      if (turnoDate.getMonth() === today.getMonth() && turnoDate.getFullYear() === today.getFullYear()) {
        const weekOfMonth = Math.floor((turnoDate.getDate() - 1) / 7);
        if (weekOfMonth < 4) {
          data[weekOfMonth]++;
        }
      }
    });

    return { categories, data };
  }

  private getYearData(): { categories: string[], data: number[] } {
    const categories = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const currentYear = new Date().getFullYear();

    this.allTurnos.forEach(turno => {
      const turnoDate = turno.fecha instanceof Date ? turno.fecha : (turno.fecha as any).toDate();

      if (turnoDate.getFullYear() === currentYear) {
        const month = turnoDate.getMonth();
        data[month]++;
      }
    });

    return { categories, data };
  }
}
