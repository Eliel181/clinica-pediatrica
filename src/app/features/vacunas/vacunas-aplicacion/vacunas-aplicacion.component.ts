import { Component, inject, Input, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VacunaService } from '../../../core/services/vacuna.service';
import { Vacuna } from '../../../core/interfaces/vacuna.model';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-vacunas-aplicacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vacunas-aplicacion.component.html',
  styleUrl: './vacunas-aplicacion.component.css'
})
export class VacunasAplicacionComponent implements OnInit {
  @Input() pacienteId: string | undefined;
  @Input() turnoId: string | undefined;

  private fb = inject(FormBuilder);
  private vacunaService = inject(VacunaService);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private firestore = inject(Firestore);

  vacunaForm!: FormGroup;
  vacunasDisponibles = signal<Vacuna[]>([]);
  loteSearchTerm = signal<string>('');
  showLoteDropdown = signal<boolean>(false);

  // Filtered vaccines based on lot number search
  filteredVacunas = computed(() => {
    const term = this.loteSearchTerm().toLowerCase();
    if (!term) return [];

    // Filter by Lote and ensure available stock
    return this.vacunasDisponibles().filter(v =>
      v.lote.toLowerCase().includes(term) && v.cantidadDisponible > 0
    );
  });

  currentUser = this.authService.currentUser;

  // History signal
  historialVacunas = signal<any[]>([]);

  ngOnInit() {
    this.initForm();
    this.loadVacunas();
    if (this.pacienteId) {
      this.loadHistorial();
    }
  }

  private initForm() {
    this.vacunaForm = this.fb.group({
      lote: ['', Validators.required],
      vacunaNombre: [{ value: '', disabled: true }, Validators.required], // Auto-filled
      vacunaId: ['', Validators.required], // Hidden ID
      fechaAplicacion: [new Date().toISOString().split('T')[0], Validators.required],
      dosis: ['1°', [Validators.required]],
      // injectionSite removed as requested
      observaciones: ['']
    });

    // Listen to Lote input changes for filtering
    this.vacunaForm.get('lote')?.valueChanges.subscribe(value => {
      this.loteSearchTerm.set(value || '');
      this.showLoteDropdown.set(true);
    });
  }

  loadVacunas() {
    this.vacunaService.getAllVacunas().subscribe((vacunas: any[]) => {
      const vacunasMapped = vacunas.map(v => ({
        ...v,
        fechaVencimiento: v.fechaVencimiento?.toDate ? v.fechaVencimiento.toDate() : (v.fechaVencimiento ? new Date(v.fechaVencimiento) : null),
        fechaIngreso: v.fechaIngreso?.toDate ? v.fechaIngreso.toDate() : (v.fechaIngreso ? new Date(v.fechaIngreso) : null)
      }));
      this.vacunasDisponibles.set(vacunasMapped);
    });
  }

  loadHistorial() {
    if (!this.pacienteId) return;
    this.vacunaService.getAllVacunasAplicadasByPacienteId(this.pacienteId).subscribe((vacunas: any[]) => {
      const mapped = vacunas.map(v => ({
        ...v,
        fechaAplicacion: v.fechaAplicacion?.toDate ? v.fechaAplicacion.toDate() : (v.fechaAplicacion ? new Date(v.fechaAplicacion) : null)
      }));
      // Sort by date descending
      mapped.sort((a, b) => b.fechaAplicacion.getTime() - a.fechaAplicacion.getTime());
      this.historialVacunas.set(mapped);
    });
  }

  seleccionarVacuna(vacuna: Vacuna) {
    this.vacunaForm.patchValue({
      lote: vacuna.lote,
      vacunaNombre: vacuna.vacuna, // or nombreComercial
      vacunaId: vacuna.id
    });
    this.showLoteDropdown.set(false);
  }

  async guardarAplicacion() {
    if (this.vacunaForm.invalid) {
      this.vacunaForm.markAllAsTouched();
      return;
    }

    try {
      const formValue = this.vacunaForm.getRawValue();
      const vacunaSeleccionada = this.vacunasDisponibles().find(v => v.id === formValue.vacunaId);

      if (!vacunaSeleccionada || vacunaSeleccionada.cantidadDisponible <= 0) {
        this.alertService.open({ type: 'error', title: 'Error', message: 'Vacuna no disponible o sin stock.' });
        return;
      }

      // Creamos el registro a insertar en la base de datos
      const aplicaciondata = {
        pacienteId: this.pacienteId,
        turnoId: this.turnoId || null,
        vacunaId: formValue.vacunaId,
        vacunaNombre: vacunaSeleccionada.vacuna,
        lote: vacunaSeleccionada.lote,
        dosis: formValue.dosis,
        fechaAplicacion: new Date(formValue.fechaAplicacion),
        aplicadaPorId: this.currentUser()?.uid,
        aplicadaPorNombre: this.currentUser()?.nombre + ' ' + this.currentUser()?.apellido,
        profesionalId: this.currentUser()?.uid, // Added as requested
        aplicadaPor: this.currentUser()?.nombre + ' ' + this.currentUser()?.apellido, // Added as requested to match model property 'aplicadaPor'
        observaciones: formValue.observaciones,
        createdAt: new Date()
      };

      await this.vacunaService.crearVacunaAplicada(aplicaciondata);

      // Actualizamos el stock disponible de la vacuna
      await this.vacunaService.updateVacuna(vacunaSeleccionada.id, {
        cantidadDisponible: vacunaSeleccionada.cantidadDisponible - 1
      });

      this.alertService.open({ type: 'success', title: 'Éxito', message: 'Vacuna registrada correctamente.' });
      this.vacunaForm.reset({
        fechaAplicacion: new Date().toISOString().split('T')[0],
        dosis: '1°'
      });
      // Refresh local stock view and history
      this.loadVacunas();
      this.loadHistorial();

    } catch (error) {
      console.error(error);
      this.alertService.open({ type: 'error', title: 'Error', message: 'Error al registrar la aplicación.' });
    }
  }

  // Helper to close dropdown when clicking outside (would normally use a directive, but simple backdrop here)
  closeDropdown() {
    setTimeout(() => this.showLoteDropdown.set(false), 200); // Delay to allow click to register
  }
}
