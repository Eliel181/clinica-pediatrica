import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClinicaService } from '../../../core/services/clinica.service';
import { Clinica, DiasNoAtencion } from '../../../core/interfaces/clinica.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-clinic-managment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clinic-managment.component.html',
  styleUrl: './clinic-managment.component.css'
})
export class ClinicManagmentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clinicaService = inject(ClinicaService);

  clinicForm: FormGroup;
  loading = false;
  clinicaId: string | undefined;
  isNewClinic = true;

  // New Day Form Controls
  newDayDate: string = '';
  newDayReason: string = '';

  constructor() {
    this.clinicForm = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      horarioAtencion: ['', Validators.required],
      logoBase64: [''],
      diasNoAtencion: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadClinica();
  }

  async loadClinica() {
    this.loading = true;
    try {
      const data = await this.clinicaService.obtnerClinica();
      if (data) {
        this.isNewClinic = false;
        this.clinicaId = data.id;

        this.clinicForm.patchValue({
          nombre: data.nombre,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          horarioAtencion: data.horarioAtencion,
          logoBase64: data.logoBase64 || ''
        });

        // Patch diasNoAtencion
        const diasArray = this.clinicForm.get('diasNoAtencion') as FormArray;
        diasArray.clear();
        if (data.diasNoAtencion) {
          data.diasNoAtencion.forEach((d: DiasNoAtencion) => {
            diasArray.push(this.createDiaGroup(d));
          });
        }

        if (data.id) this.clinicaId = data.id;
      } else {
        this.isNewClinic = true;
      }
    } catch (error) {
      console.error('Error loading clinic data', error);
      // In case of error, assume new clinic or let user try again? 
      // If service returns null for empty, this catch is for other errors.
      // But we can default to new clinic safe mode if needed, 
      // but 'obtnerClinica' modification ensures consistent return.
      this.isNewClinic = true;
    } finally {
      this.loading = false;
    }
  }

  createDiaGroup(dia?: DiasNoAtencion): FormGroup {
    return this.fb.group({
      id: [dia?.id || ''],
      dia: [dia?.dia || ''],
      fecha: [dia?.fecha || ''],
      motivo: [dia?.motivo || ''],
      fechaFirebase: [dia?.fechaFirebase || null]
    });
  }

  // --- Logo Handling ---
  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.clinicForm.patchValue({ logoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  // --- Non-working Days Handling ---
  get diasControls() {
    return (this.clinicForm.get('diasNoAtencion') as FormArray).controls;
  }

  addDia(date: string, reason: string) {
    if (date && reason) {
      const diasArray = this.clinicForm.get('diasNoAtencion') as FormArray;
      const newDia: DiasNoAtencion = {
        id: crypto.randomUUID(),
        fecha: date,
        motivo: reason,
        dia: this.getDayName(date),
        fechaFirebase: Timestamp.fromDate(new Date(date)) // approximates
      };
      diasArray.push(this.createDiaGroup(newDia));

      // Reset inputs
      this.newDayDate = '';
      this.newDayReason = '';
    }
  }

  removeDia(index: number) {
    const diasArray = this.clinicForm.get('diasNoAtencion') as FormArray;
    diasArray.removeAt(index);
  }

  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { weekday: 'long' });
  }

  // --- Save ---
  async onSubmit() {
    if (this.clinicForm.valid) {
      this.loading = true;
      try {
        const formValue = this.clinicForm.value;
        const clinicaData: Partial<Clinica> = {
          ...formValue,
          diasNoAtencion: formValue.diasNoAtencion
        };

        if (this.isNewClinic) {
          await this.clinicaService.crearClinica(clinicaData);
          this.isNewClinic = false; // After creation, it's not new anymore
          alert('Clínica creada correctamente');
          // Reload to get the ID? creating returns a ref. 
          // We should probably reload logic or just set 'isNewClinic = false'.
          // Ideally reloading ensures we have the ID for future updates without refresh.
          this.loadClinica();
        } else {
          if (this.clinicaId) {
            await this.clinicaService.updateClinica(this.clinicaId, clinicaData);
            alert('Datos actualizados correctamente');
          } else {
            console.error('No clinica ID for update');
          }
        }
      } catch (error) {
        console.error('Error saving clinic', error);
        alert('Error al guardar los datos');
      } finally {
        this.loading = false;
      }
    }
  }
}
