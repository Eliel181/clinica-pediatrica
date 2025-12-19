import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlimentacionService } from '../../../core/services/alimentacion.service';
import { AlertService } from '../../../core/services/alert.service';
import { RegistroAlimentacion, TipoIngesta, CategoriaAlimento, ReaccionAlimento, UnidadMedida, EstadisticasAlimentacionDiaria } from '../../../core/interfaces/registro-alimentacion.model';

@Component({
  selector: 'app-registro-alimentacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-alimentacion.component.html',
  styleUrl: './registro-alimentacion.component.css'
})
export class RegistroAlimentacionComponent implements OnInit {
  @Input() pacienteId?: string;

  private fb = inject(FormBuilder);
  private alimentacionService = inject(AlimentacionService);
  private alertService = inject(AlertService);

  // Signals
  registroForm!: FormGroup;
  tipoIngestaSeleccionado = signal<TipoIngesta>('Sólido');
  fechaSeleccionada = signal<Date>(new Date());
  registrosDelDia = signal<RegistroAlimentacion[]>([]);
  estadisticas = signal<EstadisticasAlimentacionDiaria | null>(null);
  cargando = signal<boolean>(false);

  // Computed
  registrosOrdenados = computed(() => {
    return this.registrosDelDia().sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      if (fechaA !== fechaB) return fechaB - fechaA;
      return b.hora.localeCompare(a.hora);
    });
  });

  fechaFormateada = computed(() => {
    const fecha = this.fechaSeleccionada();
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  });

  ngOnInit(): void {
    this.initForm();
    if (this.pacienteId) {
      this.cargarRegistrosDelDia();
    }
  }

  initForm(): void {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    this.registroForm = this.fb.group({
      hora: [horaActual, Validators.required],
      categoria: ['Fruta'],
      nombreAlimento: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0.1)]],
      unidadMedida: ['cdas', Validators.required],
      reaccion: ['Comió bien'],
      notas: ['']
    });
  }

  seleccionarTipoIngesta(tipo: TipoIngesta): void {
    this.tipoIngestaSeleccionado.set(tipo);

    // Ajustar unidades según el tipo
    if (tipo === 'Líquido') {
      this.registroForm.patchValue({ unidadMedida: 'ml' });
    } else if (tipo === 'Sólido') {
      this.registroForm.patchValue({ unidadMedida: 'cdas' });
    } else if (tipo === 'Suplemento') {
      this.registroForm.patchValue({ unidadMedida: 'ml' });
    }
  }

  cambiarFecha(dias: number): void {
    const nuevaFecha = new Date(this.fechaSeleccionada());
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    this.fechaSeleccionada.set(nuevaFecha);
    this.cargarRegistrosDelDia();
  }

  async cargarRegistrosDelDia(): Promise<void> {
    if (!this.pacienteId) return;

    this.cargando.set(true);
    try {
      this.alimentacionService.getRegistrosByPacienteYFecha(
        this.pacienteId,
        this.fechaSeleccionada()
      ).subscribe({
        next: (registros) => {
          this.registrosDelDia.set(registros);
          this.calcularEstadisticas(registros);
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error cargando registros:', error);
          this.cargando.set(false);
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.cargando.set(false);
    }
  }

  calcularEstadisticas(registros: RegistroAlimentacion[]): void {
    if (registros.length === 0) {
      this.estadisticas.set({
        fecha: this.fechaSeleccionada(),
        pacienteId: this.pacienteId || '',
        totalLiquidos: 0,
        totalCalorias: 0,
        totalRegistros: 0,
        registrosPorTipo: {
          liquidos: 0,
          solidos: 0,
          snacks: 0,
          suplementos: 0
        },
        metaLiquidos: 800,
        metaCalorias: 900
      });
    } else {
      const stats = this.alimentacionService.calcularEstadisticasDiarias(registros);
      this.estadisticas.set({
        ...stats,
        metaLiquidos: 800,
        metaCalorias: 900
      });
    }
  }

  async guardarRegistro(): Promise<void> {
    if (this.registroForm.invalid || !this.pacienteId) {
      this.alertService.open({
        title: 'Error',
        message: 'Por favor complete todos los campos requeridos',
        type: 'error'
      });
      return;
    }

    this.cargando.set(true);

    const formValue = this.registroForm.value;
    const registro: any = {
      pacienteId: this.pacienteId,
      fecha: this.fechaSeleccionada(),
      hora: formValue.hora,
      tipoIngesta: this.tipoIngestaSeleccionado(),
      nombreAlimento: formValue.nombreAlimento,
      cantidad: formValue.cantidad,
      unidadMedida: formValue.unidadMedida as UnidadMedida,
      reaccion: formValue.reaccion as ReaccionAlimento,
      causóReaccionAlergica: formValue.reaccion === 'Vomitó',
      createdAt: new Date()
    };

    // Solo agregar campos opcionales si tienen valor
    if (formValue.categoria) {
      registro.categoria = formValue.categoria as CategoriaAlimento;
    }
    if (formValue.notas && formValue.notas.trim()) {
      registro.notas = formValue.notas.trim();
    }

    try {
      await this.alimentacionService.crearRegistro(registro);

      this.alertService.open({
        title: 'Éxito',
        message: 'Registro de alimentación guardado correctamente',
        type: 'success'
      });

      this.limpiarFormulario();
      this.cargarRegistrosDelDia();
    } catch (error) {
      console.error('Error guardando registro:', error);
      this.alertService.open({
        title: 'Error',
        message: 'Error al guardar el registro. Intente nuevamente.',
        type: 'error'
      });
    } finally {
      this.cargando.set(false);
    }
  }

  limpiarFormulario(): void {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    this.registroForm.reset({
      hora: horaActual,
      categoria: 'Fruta',
      nombreAlimento: '',
      cantidad: 0,
      unidadMedida: this.tipoIngestaSeleccionado() === 'Líquido' ? 'ml' : 'cdas',
      reaccion: 'Comió bien',
      notas: ''
    });
  }

  cancelar(): void {
    this.limpiarFormulario();
  }

  obtenerIconoPorTipo(tipo: TipoIngesta): string {
    const iconos = {
      'Líquido': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      'Sólido': 'M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z',
      'Snack': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'Suplemento': 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
    };
    return iconos[tipo];
  }

  obtenerColorPorTipo(tipo: TipoIngesta): string {
    const colores = {
      'Líquido': 'blue',
      'Sólido': 'teal',
      'Snack': 'orange',
      'Suplemento': 'purple'
    };
    return colores[tipo];
  }

  calcularTiempoDesdeUltimaComida(): string {
    const stats = this.estadisticas();
    if (!stats || !stats.ultimaIngesta) return 'N/A';

    const ahora = new Date();
    const ultima = new Date(stats.ultimaIngesta);
    const diffMs = ahora.getTime() - ultima.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHoras > 0) {
      return `hace ${diffHoras}h ${diffMinutos}m`;
    }
    return `hace ${diffMinutos}m`;
  }
}
