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
import { AlertService } from '../../../core/services/alert.service';
import { PdfMakeService } from '../../../core/services/pdf-make.service';
import { ClinicaService } from '../../../core/services/clinica.service';
import { Consulta } from '../../../core/interfaces/consulta.model';

import { VacunasAplicacionComponent } from '../../vacunas/vacunas-aplicacion/vacunas-aplicacion.component';
import { GraficasPacienteComponent } from '../graficas-paciente/graficas-paciente.component';
import { RegistroAlimentacionComponent } from '../../alimentos/registro-alimentacion/registro-alimentacion.component';

@Component({
  selector: 'app-consulta-medica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, VacunasAplicacionComponent, GraficasPacienteComponent, RegistroAlimentacionComponent],
  templateUrl: './consulta-medica.component.html',
  styleUrl: './consulta-medica.component.css'
})
export class ConsultaMedicaComponent implements OnInit {
  private pacienteService = inject(PacienteService);
  private authService = inject(AuthService);
  private turnoService = inject(TurnoService);
  private consultaService = inject(ConsultaService);
  private alertService = inject(AlertService);
  private pdfMakeService = inject(PdfMakeService);
  private clinicaService = inject(ClinicaService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public route = inject(ActivatedRoute);

  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;
  turno = signal<Turno | null | undefined>(null);
  paciente = signal<Paciente | null | undefined>(null);
  turnoId: string | null = null;
  consultaForm!: FormGroup;
  consultaGuardada = signal<boolean>(false);
  activeTab = signal<'consulta' | 'vacunas' | 'alimentacion'>('consulta');

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

  async imprimirReceta() {
    try {
      const paciente = this.paciente();
      const formValue = this.consultaForm.getRawValue();
      const profesional = this.currentUser();

      if (!paciente || !profesional) {
        this.alertService.open({
          title: 'Error',
          message: 'No se puede generar la receta sin datos del paciente o profesional.',
          type: 'error'
        });
        return;
      }

      // Obtener datos de la clínica
      const clinica = await this.clinicaService.obtnerClinica();

      const content: any[] = [];

      // Encabezado de la clínica
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
                  fontSize: 16,
                  bold: true,
                  color: '#0d9488',
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

      // Título
      content.push({
        text: 'RECETA MÉDICA',
        fontSize: 18,
        bold: true,
        color: '#0d9488',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      });

      // Información del paciente
      content.push({
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'Datos del Paciente',
                fontSize: 12,
                bold: true,
                color: '#1e293b',
                margin: [0, 0, 0, 8]
              },
              {
                text: [
                  { text: 'Nombre: ', bold: true, fontSize: 10 },
                  { text: `${paciente.nombre} ${paciente.apellido}`, fontSize: 10 }
                ],
                margin: [0, 0, 0, 4]
              },
              {
                text: [
                  { text: 'DNI: ', bold: true, fontSize: 10 },
                  { text: paciente.dni, fontSize: 10 }
                ],
                margin: [0, 0, 0, 4]
              },
              {
                text: [
                  { text: 'Edad: ', bold: true, fontSize: 10 },
                  { text: this.getEdad(paciente.fechaNacimiento), fontSize: 10 }
                ],
                margin: [0, 0, 0, 4]
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                text: 'Fecha de Consulta',
                fontSize: 12,
                bold: true,
                color: '#1e293b',
                margin: [0, 0, 0, 8]
              },
              {
                text: new Date().toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                fontSize: 10
              }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      });

      // Diagnóstico
      if (formValue.diagnostico) {
        content.push({
          stack: [
            {
              text: 'Diagnóstico',
              fontSize: 12,
              bold: true,
              color: '#1e293b',
              margin: [0, 0, 0, 8]
            },
            {
              text: formValue.diagnostico,
              fontSize: 10,
              lineHeight: 1.4
            }
          ],
          margin: [0, 0, 0, 15]
        });
      }

      // Tratamiento / Receta
      if (formValue.tratamiento) {
        content.push({
          stack: [
            {
              text: 'Tratamiento Indicado',
              fontSize: 12,
              bold: true,
              color: '#1e293b',
              margin: [0, 0, 0, 8]
            },
            {
              text: formValue.tratamiento,
              fontSize: 10,
              lineHeight: 1.5,
              preserveLeadingSpaces: true
            }
          ],
          margin: [0, 0, 0, 30]
        });
      }

      // Espacio para firma
      content.push({
        columns: [
          { width: '*', text: '' },
          {
            width: 200,
            stack: [
              {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: 200,
                    y2: 0,
                    lineWidth: 1,
                    lineColor: '#64748b'
                  }
                ],
                margin: [0, 40, 0, 5]
              },
              {
                text: `Dr. ${profesional.nombre} ${profesional.apellido}`,
                fontSize: 10,
                bold: true,
                alignment: 'center',
                color: '#1e293b'
              },
              {
                text: 'Pediatra',
                fontSize: 9,
                alignment: 'center',
                color: '#64748b',
                margin: [0, 2, 0, 0]
              },
              {
                text: `Mat. ${profesional.documento || 'N/A'}`,
                fontSize: 8,
                alignment: 'center',
                color: '#94a3b8',
                margin: [0, 2, 0, 0]
              }
            ]
          }
        ],
        margin: [0, 20, 0, 0]
      });

      // Generar PDF
      await this.pdfMakeService.generatePdf(
        content,
        `Receta_${paciente.nombre}_${paciente.apellido}_${new Date().toISOString().split('T')[0]}`
      );

    } catch (error) {
      console.error('Error generando receta:', error);
      this.alertService.open({
        title: 'Error',
        message: 'Error al generar la receta. Por favor, intente nuevamente.',
        type: 'error'
      });
    }
  }
}
