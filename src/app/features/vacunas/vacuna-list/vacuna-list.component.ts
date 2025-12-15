import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { VacunaService } from '../../../core/services/vacuna.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { Vacuna } from '../../../core/interfaces/vacuna.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vacuna-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vacuna-list.component.html',
  styleUrl: './vacuna-list.component.css'
})
export class VacunaListComponent implements OnInit {
  private vacunaService = inject(VacunaService);
  private fb: FormBuilder = inject(FormBuilder);
  private alertService: AlertService = inject(AlertService);

  isLoading = signal(true)
  vacunas: WritableSignal<Vacuna[]> = signal([]);

  vacunaForm: FormGroup;
  isEditMode: boolean = false;
  isModalVisible: boolean = false;
  currentVacunaId: string | null = null;

  constructor() {
    this.vacunaForm = this.fb.group({
      nombreComercial: ['', [Validators.required]],
      vacuna: ['', [Validators.required]],
      laboratorio: ['', [Validators.required]],
      lote: ['', [Validators.required]],
      fechaVencimiento: ['', [Validators.required]],
      cantidadTotal: ['', [Validators.required, Validators.min(0)]],
      cantidadDisponible: ['', [Validators.required, Validators.min(0)]],
      dosisPorUnidad: [1, [Validators.required, Validators.min(1)]],
      temperaturaMin: [2, [Validators.required]],
      temperaturaMax: [8, [Validators.required]],
      proveedor: ['', [Validators.required]],
      fechaIngreso: [new Date().toISOString().split('T')[0], [Validators.required]],
      recibidoPor: ['', []],
      observaciones: ['', []],
    });
  }

  ngOnInit(): void {
    this.vacunaService.getAllVacunas().subscribe({
      next: (vacunasData: any[]) => { // Use any[] temporarily to handle potential raw data structure
        const vacunas: Vacuna[] = vacunasData.map(v => {
          return {
            ...v,
            fechaVencimiento: v.fechaVencimiento?.toDate ? v.fechaVencimiento.toDate() : (v.fechaVencimiento ? new Date(v.fechaVencimiento) : null),
            fechaIngreso: v.fechaIngreso?.toDate ? v.fechaIngreso.toDate() : (v.fechaIngreso ? new Date(v.fechaIngreso) : null),
            createdAt: v.createdAt?.toDate ? v.createdAt.toDate() : (v.createdAt ? new Date(v.createdAt) : null),
            updatedAt: v.updatedAt?.toDate ? v.updatedAt.toDate() : (v.updatedAt ? new Date(v.updatedAt) : null),
          } as Vacuna;
        });
        this.vacunas.set(vacunas);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.alertService.open({
          title: 'Error',
          message: 'Error al cargar las vacunas',
          type: 'error'
        });
        this.isLoading.set(false);
      }
    })
  }

  openModal(vacuna?: Vacuna) {
    this.isEditMode = !!vacuna;
    if (vacuna) {
      this.currentVacunaId = vacuna.id;
      // Format dates for input[type="date"]
      const formValue = { ...vacuna };
      if (formValue.fechaVencimiento) {
        // Handle conversion if it's a Timestamp or Date
        let date = formValue.fechaVencimiento;
        // Handle Firestore Timestamp if needed, but assuming simple Date for now or string matching interface
        // Ideally transform to YYYY-MM-DD
        try {
          const d = new Date(date); // Works for Date or string or Timestamp.toDate() if it was a timestamp object but here we get raw data
          // The interface says Date, but firestore returns objects. Wait, collectionData usually returns Timestamps.
          // But let's assume standard Date handling logic or helpers. 
          // To be safe with "date" input:

          // Simplification: if it has toDate, use it.
          if ((date as any).toDate) {
            date = (date as any).toDate();
          }

          (formValue as any).fechaVencimiento = new Date(date).toISOString().split('T')[0];
        } catch (e) { console.warn("Error parsing date", e); }
      }
      if (formValue.fechaIngreso) {
        let date = formValue.fechaIngreso;
        if ((date as any).toDate) date = (date as any).toDate();
        (formValue as any).fechaIngreso = new Date(date).toISOString().split('T')[0];
      }

      this.vacunaForm.patchValue(formValue);
    } else {
      this.currentVacunaId = null;
      this.vacunaForm.reset({
        dosisPorUnidad: 1,
        temperaturaMin: 2,
        temperaturaMax: 8,
        fechaIngreso: new Date().toISOString().split('T')[0]
      });
    }
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
    this.vacunaForm.reset();
    this.currentVacunaId = null;
    this.isEditMode = false;
  }

  saveVacuna() {
    if (this.vacunaForm.invalid) {
      this.vacunaForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.vacunaForm.value;

    // Convert date strings back to Date objects
    const vacunaData: Partial<Vacuna> = {
      ...formValue,
      fechaVencimiento: new Date(formValue.fechaVencimiento),
      fechaIngreso: new Date(formValue.fechaIngreso),
      updatedAt: new Date()
    };

    if (this.isEditMode && this.currentVacunaId) {
      this.vacunaService.updateVacuna(this.currentVacunaId, vacunaData)
        .then(() => {
          this.alertService.open({
            title: 'Éxito',
            message: 'Vacuna actualizada correctamente',
            type: 'success'
          });
          this.closeModal();
          this.isLoading.set(false);
        })
        .catch(err => {
          console.error(err);
          this.alertService.open({
            title: 'Error',
            message: 'Error al actualizar la vacuna',
            type: 'error'
          });
          this.isLoading.set(false);
        });
    } else {
      vacunaData.createdAt = new Date();
      this.vacunaService.crearVacuna(vacunaData)
        .then(() => {
          this.alertService.open({
            title: 'Éxito',
            message: 'Vacuna creada correctamente',
            type: 'success'
          });
          this.closeModal();
          this.isLoading.set(false);
        })
        .catch(err => {
          console.error(err);
          this.alertService.open({
            title: 'Error',
            message: 'Error al crear la vacuna',
            type: 'error'
          });
          this.isLoading.set(false);
        });
    }
  }
}
