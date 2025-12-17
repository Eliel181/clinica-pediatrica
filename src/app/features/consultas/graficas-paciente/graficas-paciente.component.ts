import { Component, Input, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  NgApexchartsModule // Import NgApexchartsModule
} from "ng-apexcharts";
import { ConsultaService } from '../../../core/services/consulta.service';
import { Consulta } from '../../../core/interfaces/consulta.model';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-graficas-paciente',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule], // Add imports
  templateUrl: './graficas-paciente.component.html',
  styleUrl: './graficas-paciente.component.css'
})
export class GraficasPacienteComponent implements OnInit {
  @Input() pacienteId: string | undefined;
  @Input() fechaNacimiento: string | Date | undefined; // Needed for ideal growth calc
  @ViewChild("chart") chart: ChartComponent | undefined;

  public weightChartOptions: Partial<ChartOptions> | any;
  public heightChartOptions: Partial<ChartOptions> | any;
  private consultaService = inject(ConsultaService);

  hasData = signal(false);

  constructor() {
    this.initChartOptions();
  }

  ngOnInit() {
    if (this.pacienteId) {
      this.loadData();
    }
  }

  private initChartOptions() {
    const commonOptions = {
      chart: {
        height: 350,
        type: "line",
        zoom: { enabled: false },
        fontFamily: 'Inter, sans-serif',
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      grid: {
        row: { colors: ["#f8fafc", "transparent"], opacity: 0.5 },
        borderColor: '#e2e8f0'
      },
      xaxis: { categories: [] }
    };

    this.weightChartOptions = {
      ...commonOptions,
      series: [],
      title: {
        text: "Evolución de Peso",
        align: "left",
        style: { fontSize: '16px', fontWeight: 'bold', fontFamily: 'Inter', color: '#1e293b' }
      },
      colors: ["#0d9488", "#cbd5e1"] // Teal (Real), Slate-300 (Ideal)
    };

    this.heightChartOptions = {
      ...commonOptions,
      series: [],
      title: {
        text: "Evolución de Altura",
        align: "left",
        style: { fontSize: '16px', fontWeight: 'bold', fontFamily: 'Inter', color: '#1e293b' }
      },
      colors: ["#3b82f6", "#cbd5e1"] // Blue (Real), Slate-300 (Ideal)
    };
  }

  loadData() {
    this.consultaService.getConsultasByPacienteId(this.pacienteId!).subscribe(consultas => {
      if (consultas.length === 0) return;

      // Sort by date ascending
      const sortedConsultas = consultas.sort((a, b) => {
        const dateA = this.getDate(a.fecha);
        const dateB = this.getDate(b.fecha);
        return dateA.getTime() - dateB.getTime();
      });

      const fechas = sortedConsultas.map(c => this.getDate(c.fecha).toLocaleDateString());

      // Real Data
      const pesosReales = sortedConsultas.map(c => c.peso || 0);
      const tallasReales = sortedConsultas.map(c => c.talla || 0);

      // Ideal Data (Calculated)
      const pesosIdeales = sortedConsultas.map(c => {
        const ageMonths = this.getAgeInMonths(this.getDate(c.fecha));
        return this.getIdealWeight(ageMonths);
      });

      const tallasIdeales = sortedConsultas.map(c => {
        const ageMonths = this.getAgeInMonths(this.getDate(c.fecha));
        return this.getIdealHeight(ageMonths);
      });

      this.hasData.set(true);

      // Update Weight Chart
      this.weightChartOptions = {
        ...this.weightChartOptions,
        series: [
          { name: "Peso Real (kg)", data: pesosReales },
          { name: "Peso Ideal (kg)", data: pesosIdeales } // Reference curve
        ],
        xaxis: { categories: fechas }
      };

      // Update Height Chart
      this.heightChartOptions = {
        ...this.heightChartOptions,
        series: [
          { name: "Altura Real (cm)", data: tallasReales },
          { name: "Altura Ideal (cm)", data: tallasIdeales } // Reference curve
        ],
        xaxis: { categories: fechas }
      };
    });
  }

  // --- Helper Calculations (Simplified WHO Standards) ---

  private getAgeInMonths(date: Date): number {
    if (!this.fechaNacimiento) return 0;
    const birth = new Date(this.fechaNacimiento);
    // Rough diff in months
    return (date.getFullYear() - birth.getFullYear()) * 12 + (date.getMonth() - birth.getMonth());
  }

  private getIdealWeight(months: number): number {
    if (months <= 12) return (0.5 * months) + 4.5;
    if (months <= 60) return (2 * (months / 12)) + 8; // 1-5 years
    return (3 * (months / 12)) + 7; // > 5 years approx
  }

  private getIdealHeight(months: number): number {
    if (months <= 12) return 50 + (25 * (months / 12)); // 50cm -> 75cm first year
    return (6 * (months / 12)) + 77; // ~6cm per year after age 1
  }

  private getDate(date: any): Date {
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    return new Date(date);
  }
}
