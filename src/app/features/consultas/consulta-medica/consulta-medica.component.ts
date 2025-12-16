import { Component, inject, OnInit, signal, Signal } from '@angular/core';
import { PacienteService } from '../../../core/services/paciente.service';
import { AuthService } from '../../../core/services/auth.service';
import { TurnoService } from '../../../core/services/turno.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { Turno } from '../../../core/interfaces/turno.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConsultaService } from '../../../core/services/consulta.service';
import { AlertService } from '../../../core/services/alert.service'; // Import AlertService
import { Consulta } from '../../../core/interfaces/consulta.model';

import { VacunasAplicacionComponent } from '../../vacunas/vacunas-aplicacion/vacunas-aplicacion.component';

@Component({
  selector: 'app-consulta-medica',
  imports: [CommonModule, ReactiveFormsModule, VacunasAplicacionComponent],
  templateUrl: './consulta-medica.component.html',
  styleUrl: './consulta-medica.component.css'
})
export class ConsultaMedicaComponent implements OnInit {
  private pacienteService = inject(PacienteService);
  private authService = inject(AuthService);
  private turnoService = inject(TurnoService);
  private consultaService = inject(ConsultaService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public route = inject(ActivatedRoute);

  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;
  turno = signal<Turno | null | undefined>(null);
  paciente = signal<Paciente | null | undefined>(null);
  turnoId: string | null = null;
  consultaForm!: FormGroup;
  consultaGuardada = signal<boolean>(false);
  activeTab = signal<'consulta' | 'vacunas'>('consulta');

  ngOnInit(): void {
    this.initForm();
    this.turnoId = this.route.snapshot.paramMap.get('id') || '';
    if (this.turnoId) {
      this.turnoService.getTurnoById(this.turnoId).subscribe((turno) => {
        this.turno.set(turno);
        console.log('Turno loaded:', turno);

        if (turno && turno.pacienteId) {
          this.pacienteService.getPacienteById(turno.pacienteId).then((paciente) => {
            if (paciente) {
              console.log('Paciente loaded:', paciente);
              this.paciente.set(paciente);
            }
          });
        }
      });
    }
  }

  private initForm(): void {
    this.consultaForm = this.fb.group({
      motivoConsulta: ['', Validators.required],
      peso: [null],
      talla: [null],
      perimetroCefalico: [null],
      temperatura: [null],
      imc: [{ value: null, disabled: true }], // BMI is calculated
      diagnostico: [''],
      tratamiento: [''], // Simplificado por ahora
      indicaciones: [''], // Simplificado
      notas: [''] // Notas internas
    });

    // Calculate BMI automatically
    this.consultaForm.valueChanges.subscribe(values => {
      const peso = values.peso;
      const talla = values.talla;
      if (peso && talla) {
        const tallaMetros = talla / 100;
        const imc = peso / (tallaMetros * tallaMetros);
        this.consultaForm.patchValue({ imc: parseFloat(imc.toFixed(2)) }, { emitEvent: false });
      } else {
        this.consultaForm.patchValue({ imc: null }, { emitEvent: false });
      }
    });
  }

  getEdad(fechaNacimiento: string | Date | undefined): string {
    if (!fechaNacimiento) return 'N/A';
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} años`;
  }

  async guardarConsulta() {
    if (this.consultaForm.invalid) {
      this.consultaForm.markAllAsTouched();
      this.alertService.open({
        title: 'Error',
        message: 'Por favor complete los campos obligatorios.',
        type: 'error'
      });
      return;
    }

    const turno = this.turno();
    if (!turno) return;

    try {
      const formValue = this.consultaForm.getRawValue(); // Use getRawValue to include disabled fields like IMC
      const consulta: Partial<Consulta> = {
        pacienteId: turno.pacienteId,
        responsableId: turno.responsableId,
        profesionalId: this.currentUser()?.uid || '',
        fecha: new Date(),
        motivoConsulta: formValue.motivoConsulta,
        peso: formValue.peso,
        talla: formValue.talla,
        perimetroCefalico: formValue.perimetroCefalico,
        temperatura: formValue.temperatura,
        imc: formValue.imc,
        diagnostico: formValue.diagnostico,
        // Adaptamos los arrays por ahora a strings si es necesario o los dejamos vacíos si el input es simple
        tratamiento: formValue.tratamiento ? [formValue.tratamiento] : [],
        indicaciones: formValue.indicaciones ? [formValue.indicaciones] : [],
        notas: formValue.notas,
        createdAt: new Date()
      };

      await this.consultaService.crearConsulta(consulta);
      await this.turnoService.updateTurno(turno.id, { estado: 'Atendido' });

      this.alertService.open({
        title: 'Éxito',
        message: 'Consulta guardada. Ahora puede registrar vacunas.',
        type: 'success'
      });

      this.consultaGuardada.set(true);
      this.consultaForm.disable();

    } catch (error) {
      console.error('Error al guardar consulta:', error);
      this.alertService.open({
        title: 'Error',
        message: 'Ocurrió un error al guardar la consulta.',
        type: 'error'
      });
    }
  }

  registrarVacuna() {
    if (this.consultaGuardada() && this.turnoId) {
      this.activeTab.set('vacunas');
    }
  }

  volver() {
    this.router.navigate(['/administracion/mis-turnos-profesional']);
  }
}
