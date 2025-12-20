import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PacienteService } from '../../../core/services/paciente.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ConsultaService } from '../../../core/services/consulta.service';
import { VacunaService } from '../../../core/services/vacuna.service';
import { AlimentacionService } from '../../../core/services/alimentacion.service';
import { PdfMakeService } from '../../../core/services/pdf-make.service';
import { ClinicaService } from '../../../core/services/clinica.service';
import { AlertService } from '../../../core/services/alert.service';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { Cliente } from '../../../core/interfaces/cliente.model';
import { Consulta } from '../../../core/interfaces/consulta.model';
import { VacunaAplicada } from '../../../core/interfaces/vacuna-aplicada.model';
import { RegistroAlimentacion } from '../../../core/interfaces/registro-alimentacion.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-historia-clinica',
  imports: [CommonModule, RouterModule],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pacienteService = inject(PacienteService);
  private clienteService = inject(ClienteService);
  private consultaService = inject(ConsultaService);
  private vacunaService = inject(VacunaService);
  private alimentacionService = inject(AlimentacionService);
  private pdfMakeService = inject(PdfMakeService);
  private clinicaService = inject(ClinicaService);
  private alertService = inject(AlertService);

  paciente = signal<Paciente | undefined>(undefined);
  responsable = signal<Cliente | undefined>(undefined);
  consultas = signal<Consulta[]>([]);
  vacunasAplicadas = signal<VacunaAplicada[]>([]);
  registrosAlimentacion = signal<RegistroAlimentacion[]>([]);

  isLoading = signal<boolean>(true);
  isGeneratingPdf = signal<boolean>(false);

  ngOnInit(): void {
    const pacienteId = this.route.snapshot.paramMap.get('id');
    if (pacienteId) {
      this.cargarDatosPaciente(pacienteId);
    } else {
      this.router.navigate(['/administracion/gestion-pacientes']);
    }
  }

  async cargarDatosPaciente(pacienteId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      // Cargar paciente
      const paciente = await this.pacienteService.getPacienteById(pacienteId);
      if (!paciente) {
        this.alertService.open({
          title: 'Error',
          message: 'No se encontró el paciente',
          type: 'error'
        });
        this.router.navigate(['/administracion/gestion-pacientes']);
        return;
      }
      this.paciente.set(paciente);

      // Cargar responsable
      if (paciente.responsableId) {
        const responsable = await this.clienteService.getClienteById(paciente.responsableId);
        this.responsable.set(responsable);
      }

      // Cargar datos relacionados de forma independiente para manejar errores
      console.log('🔍 Cargando datos para paciente:', pacienteId);

      // Cargar consultas
      this.consultaService.getConsultasByPacienteId(pacienteId).subscribe({
        next: (consultas) => {
          console.log('✅ Consultas cargadas:', consultas.length);
          this.consultas.set(consultas);
        },
        error: (error) => {
          console.error('❌ Error cargando consultas:', error);
          this.consultas.set([]);
        }
      });

      // Cargar vacunas
      this.vacunaService.getAllVacunasAplicadasByPacienteId(pacienteId).subscribe({
        next: (vacunas) => {
          console.log('💉 Vacunas cargadas:', vacunas);
          this.vacunasAplicadas.set(vacunas);
        },
        error: (error) => {
          console.error('❌ Error cargando vacunas:', error);
          this.vacunasAplicadas.set([]);
        }
      });

      // Cargar alimentación
      this.alimentacionService.getRegistrosByPacienteId(pacienteId).subscribe({
        next: (registros) => {
          console.log('🍎 Alimentación cargada:', registros.length);
          this.registrosAlimentacion.set(registros);
        },
        error: (error) => {
          console.error('❌ Error cargando alimentación:', error);
          this.registrosAlimentacion.set([]);
        }
      });

      // Marcar como cargado después de un pequeño delay
      setTimeout(() => {
        this.isLoading.set(false);
      }, 500);

    } catch (error) {
      console.error('❌ Error general:', error);
      this.isLoading.set(false);
    }
  }

  getEdad(fechaNacimiento: string): string {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  }

  // Helper para convertir Timestamp de Firestore a Date
  toDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp?.toDate) return timestamp.toDate();
    return new Date(timestamp);
  }

  async generarReporte(): Promise<void> {
    this.isGeneratingPdf.set(true);
    try {
      const paciente = this.paciente();
      const responsable = this.responsable();
      const consultas = this.consultas();
      const vacunas = this.vacunasAplicadas();
      const alimentacion = this.registrosAlimentacion();

      if (!paciente) {
        this.alertService.open({
          title: 'Error',
          message: 'No hay datos del paciente para generar el reporte',
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
        text: 'HISTORIA CLÍNICA',
        fontSize: 20,
        bold: true,
        color: '#0d9488',
        alignment: 'center',
        margin: [0, 0, 0, 25]
      });

      // Información del Paciente
      content.push({
        text: 'Información del Paciente',
        fontSize: 14,
        bold: true,
        color: '#1e293b',
        margin: [0, 0, 0, 10]
      });

      content.push({
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Nombre Completo:', bold: true, fontSize: 10 },
              { text: `${paciente.nombre} ${paciente.apellido}`, fontSize: 10 }
            ],
            [
              { text: 'DNI:', bold: true, fontSize: 10 },
              { text: paciente.dni, fontSize: 10 }
            ],
            [
              { text: 'Fecha de Nacimiento:', bold: true, fontSize: 10 },
              { text: new Date(paciente.fechaNacimiento).toLocaleDateString('es-AR'), fontSize: 10 }
            ],
            [
              { text: 'Edad:', bold: true, fontSize: 10 },
              { text: this.getEdad(paciente.fechaNacimiento), fontSize: 10 }
            ],
            [
              { text: 'Sexo:', bold: true, fontSize: 10 },
              { text: paciente.sexo, fontSize: 10 }
            ],
            [
              { text: 'Alergias:', bold: true, fontSize: 10 },
              { text: paciente.alergias && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'Ninguna', fontSize: 10 }
            ],
            [
              { text: 'Enfermedades Crónicas:', bold: true, fontSize: 10 },
              { text: paciente.enfermedadesCronicas && paciente.enfermedadesCronicas.length > 0 ? paciente.enfermedadesCronicas.join(', ') : 'Ninguna', fontSize: 10 }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      });

      // Información del Responsable
      if (responsable) {
        content.push({
          text: 'Responsable',
          fontSize: 14,
          bold: true,
          color: '#1e293b',
          margin: [0, 0, 0, 10]
        });

        content.push({
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                { text: 'Nombre:', bold: true, fontSize: 10 },
                { text: `${responsable.nombre} ${responsable.apellido}`, fontSize: 10 }
              ],
              [
                { text: 'DNI:', bold: true, fontSize: 10 },
                { text: responsable.documento, fontSize: 10 }
              ],
              [
                { text: 'Email:', bold: true, fontSize: 10 },
                { text: responsable.email, fontSize: 10 }
              ],
              [
                { text: 'Teléfono:', bold: true, fontSize: 10 },
                { text: responsable.telefono || 'No especificado', fontSize: 10 }
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        });
      }

      // Consultas Médicas
      if (consultas.length > 0) {
        content.push({
          text: 'Historial de Consultas',
          fontSize: 14,
          bold: true,
          color: '#1e293b',
          margin: [0, 10, 0, 10],
          pageBreak: 'before'
        });

        consultas.forEach((consulta, index) => {
          const fechaConsulta = consulta.fecha instanceof Date
            ? consulta.fecha
            : (consulta.fecha as any)?.toDate
              ? (consulta.fecha as any).toDate()
              : new Date(consulta.fecha);

          content.push({
            stack: [
              {
                text: `Consulta ${index + 1} - ${fechaConsulta.toLocaleDateString('es-AR')}`,
                fontSize: 11,
                bold: true,
                color: '#0d9488',
                margin: [0, 5, 0, 5]
              },
              {
                text: [
                  { text: 'Motivo: ', bold: true, fontSize: 10 },
                  { text: consulta.motivoConsulta, fontSize: 10 }
                ],
                margin: [0, 2, 0, 2]
              },
              {
                text: [
                  { text: 'Diagnóstico: ', bold: true, fontSize: 10 },
                  { text: consulta.diagnostico || 'No especificado', fontSize: 10 }
                ],
                margin: [0, 2, 0, 2]
              },
              {
                text: [
                  { text: 'Peso: ', bold: true, fontSize: 10 },
                  { text: consulta.peso ? `${consulta.peso} kg` : 'No registrado', fontSize: 10 },
                  { text: '  |  Talla: ', bold: true, fontSize: 10 },
                  { text: consulta.talla ? `${consulta.talla} cm` : 'No registrado', fontSize: 10 }
                ],
                margin: [0, 2, 0, 2]
              }
            ],
            margin: [0, 0, 0, 10]
          });
        });
      }

      // Vacunas Aplicadas
      if (vacunas.length > 0) {
        content.push({
          text: 'Registro de Vacunación',
          fontSize: 14,
          bold: true,
          color: '#1e293b',
          margin: [0, 10, 0, 10]
        });

        const vacunasTableBody: any[] = [
          [
            { text: 'Vacuna', bold: true, fontSize: 10, fillColor: '#f1f5f9' },
            { text: 'Fecha', bold: true, fontSize: 10, fillColor: '#f1f5f9' },
            { text: 'Dosis', bold: true, fontSize: 10, fillColor: '#f1f5f9' }
          ]
        ];

        //no funciona
        vacunas.forEach(vacuna => {
          const fechaVacuna = vacuna.fechaAplicacion instanceof Date
            ? vacuna.fechaAplicacion
            : (vacuna.fechaAplicacion as any)?.toDate
              ? (vacuna.fechaAplicacion as any).toDate()
              : new Date(vacuna.fechaAplicacion);

          vacunasTableBody.push([
            { text: vacuna.vacunaNombre, fontSize: 9 },
            { text: fechaVacuna.toLocaleDateString('es-AR'), fontSize: 9 },
            { text: vacuna.dosis || 'N/A', fontSize: 9 }
          ]);
        });


        content.push({
          table: {
            widths: ['50%', '25%', '25%'],
            body: vacunasTableBody
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        });
      }

      // Registro de Alimentación (últimos 10)
      if (alimentacion.length > 0) {
        content.push({
          text: 'Registro de Alimentación (Últimos registros)',
          fontSize: 14,
          bold: true,
          color: '#1e293b',
          margin: [0, 10, 0, 10]
        });

        const alimentacionReciente = alimentacion.slice(0, 10);
        alimentacionReciente.forEach((registro, index) => {
          const fechaRegistro = registro.fecha instanceof Date
            ? registro.fecha
            : (registro.fecha as any)?.toDate
              ? (registro.fecha as any).toDate()
              : new Date(registro.fecha);

          content.push({
            text: [
              { text: `${fechaRegistro.toLocaleDateString('es-AR')} ${registro.hora} - `, bold: true, fontSize: 9 },
              { text: `${registro.nombreAlimento} (${registro.cantidad} ${registro.unidadMedida})`, fontSize: 9 }
            ],
            margin: [0, 2, 0, 2]
          });
        });
      }

      // Generar PDF
      await this.pdfMakeService.generatePdf(
        content,
        `Historia_Clinica_${paciente.nombre}_${paciente.apellido}_${new Date().toISOString().split('T')[0]}`
      );

      this.alertService.open({
        title: 'Reporte Generado',
        message: 'El reporte de historia clínica se ha generado exitosamente',
        type: 'success'
      });

    } catch (error) {
      console.error('Error generando reporte:', error);
      this.alertService.open({
        title: 'Error',
        message: 'Error al generar el reporte. Por favor, intente nuevamente.',
        type: 'error'
      });
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  volver(): void {
    this.router.navigate(['/administracion/gestion-pacientes']);
  }
}
