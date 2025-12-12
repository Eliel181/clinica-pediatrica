import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject, EffectRef, effect } from '@angular/core';
import { ClienteService } from '../../../core/services/cliente.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { RouterLink } from '@angular/router';
import { ServicioService } from '../../../core/services/servicio.service';
import { Servicio } from '../../../core/interfaces/servicio.model';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';

@Component({
    selector: 'app-solicitar-turno',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './solicitar-turno.component.html',
    styleUrl: './solicitar-turno.component.css'
})
export class SolicitarTurnoComponent {
    private clienteService = inject(ClienteService);
    private pacienteService = inject(PacienteService);
    private servicioService = inject(ServicioService);
    private usuarioService = inject(UsuarioService);

    currentStep = signal(1);

    steps = [
        { number: 1, title: 'Paciente', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { number: 2, title: 'Categoría', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { number: 3, title: 'Servicio', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { number: 4, title: 'Profesional', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { number: 5, title: 'Fecha', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { number: 6, title: 'Confirmar', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
    ];

    // Data Signals
    pacientes = signal<Paciente[]>([]);
    servicios = signal<Servicio[]>([]);
    profesionales = signal<Usuario[]>([]);
    loadingProfesionales = signal<boolean>(false);

    // Computed Categories
    categorias = computed(() => {
        const services = this.servicios();
        const uniqueCategories = [...new Set(services.map(s => s.categoria))];
        return uniqueCategories.map(cat => ({
            id: cat,
            nombre: cat,
            icon: this.getCategoryIcon(cat)
        }));
    });

    diasMapping: Record<string, number> = {
        "domingo": 0,
        "lunes": 1,
        "martes": 2,
        "miércoles": 3,
        "miercoles": 3, // por si viene sin tilde
        "jueves": 4,
        "viernes": 5,
        "sábado": 6,
        "sabado": 6
    };


    constructor() {
        // Load Patients
        effect(() => {
            const client = this.clienteService.currentClient();
            if (client && client.id) {
                this.pacienteService.getPacientesByResponsable(client.id).subscribe(data => {
                    this.pacientes.set(data);
                });
            }
        });

        // Load Active Services
        this.servicioService.getActiveServices().subscribe(data => {
            this.servicios.set(data);
        });

        // Load Professionals by Service
        effect(() => {
            const service = this.selectedServicio();
            if (service && service.id) {
                this.loadingProfesionales.set(true);
                this.usuarioService.getPediatrasByServicio(service.id).subscribe({
                    next: (data) => {
                        this.profesionales.set(data);
                        this.loadingProfesionales.set(false);
                    },
                    error: () => {
                        this.profesionales.set([]);
                        this.loadingProfesionales.set(false);
                    }
                });
            } else {
                this.profesionales.set([]);
            }
        });
    }



    // Helper methods for dates
    obtenerProximaFecha(diaNombre: string): Date {
        const hoy = new Date();
        const diaActual = hoy.getDay();

        const diaBuscado = this.diasMapping[diaNombre.toLowerCase()];
        if (diaBuscado === undefined) return new Date(); // Fallback

        let diferencia = diaBuscado - diaActual;

        // If today is the day or past, move to next week
        if (diferencia <= 0) {
            diferencia += 7;
        }

        const fecha = new Date();
        fecha.setDate(hoy.getDate() + diferencia);

        return fecha;
    }

    obtenerFechasSiguientes(diaNombre: string, cantidad: number): Date[] {
        const fechas: Date[] = [];
        let fecha = this.obtenerProximaFecha(diaNombre);

        for (let i = 0; i < cantidad; i++) {
            fechas.push(new Date(fecha));
            fecha.setDate(fecha.getDate() + 7);
        }

        return fechas;
    }

    generarFechasDisponibles(diasAtencion: string[]) {
        if (!diasAtencion || diasAtencion.length === 0) {
            this.fechas.set([]);
            return;
        }

        const todasLasFechas: Date[] = [];
        diasAtencion.forEach(dia => {
            const fechasDia = this.obtenerFechasSiguientes(dia, 2);
            todasLasFechas.push(...fechasDia);
        });

        // Sort by date
        todasLasFechas.sort((a, b) => a.getTime() - b.getTime());

        // Format for display
        const fechasFormateadas = todasLasFechas.map(f => {
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
            const diaStr = diasSemana[f.getDay()];
            const fechaStr = f.getDate();
            return `${diaStr} ${fechaStr}`;
        });

        this.fechas.set(fechasFormateadas);
        if (fechasFormateadas.length > 0) {
            this.selectedFecha.set(fechasFormateadas[0]);
        }
    }

    fechas = signal<string[]>([]);
    horasDisponibles = signal<string[]>([]);

    // State
    selectedPaciente = signal<Paciente | null>(null);
    selectedCategoria = signal<any>(null);
    selectedServicio = signal<Servicio | null>(null);
    selectedProfesional = signal<any>(null);
    selectedFecha = signal<string>('');
    selectedHora = signal<string>('');

    // Computed
    availableServices = computed(() => {
        const cat = this.selectedCategoria();
        if (!cat) return [];
        return this.servicios().filter(s => s.categoria === cat.id);
    });

    availableProfesionales = computed(() => {
        return this.profesionales();
    });

    calculateAge(dateString: string): number {
        if (!dateString) return 0;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    getCategoryIcon(categoria: string): string {
        return '';
    }

    nextStep() {
        if (this.currentStep() < 6) {
            this.currentStep.update(v => v + 1);
        }
    }

    prevStep() {
        if (this.currentStep() > 1) {
            this.currentStep.update(v => v - 1);
        }
    }

    selectPaciente(paciente: any) {
        this.selectedPaciente.set(paciente);
        this.nextStep();
    }

    selectCategoria(cat: any) {
        this.selectedCategoria.set(cat);
        // Reset subsequent selections
        this.selectedServicio.set(null);
        this.selectedProfesional.set(null);
        this.nextStep();
    }

    selectServicio(servicio: Servicio) {
        this.selectedServicio.set(servicio);
        this.selectedProfesional.set(null);
        this.horasDisponibles.set([]); // Reset slots until professional is selected
        this.nextStep();
    }

    selectProfesional(prof: any) {
        this.selectedProfesional.set(prof);

        const servicio = this.selectedServicio();
        const duracion = servicio?.duracionMinutos || 30;

        // Determine shift hours
        let startHour = 8;
        let endHour = 17;

        if (prof.turno === 'Mañana') {
            startHour = 7;
            endHour = 12;
        } else if (prof.turno === 'Tarde') {
            startHour = 13;
            endHour = 18;
        }

        this.generarHorarios(duracion, startHour, endHour);

        if (prof.diasAtencion) {
            this.generarFechasDisponibles(prof.diasAtencion);
        } else {
            this.fechas.set([]);
        }
        this.nextStep();
    }

    //guardamos la hora seleccionada
    selectHora(hora: string) {
        this.selectedHora.set(hora);
    }

    generarHorarios(duracionMinutos: number, startHour: number, endHour: number) {
        const slots: string[] = [];

        let currentMinutes = startHour * 60;
        const endMinutes = endHour * 60;

        while (currentMinutes < endMinutes) {
            const h = Math.floor(currentMinutes / 60);
            const m = currentMinutes % 60;

            // Format HH:mm
            const hStr = h < 10 ? `0${h}` : `${h}`;
            const mStr = m < 10 ? `0${m}` : `${m}`;
            const ampm = h < 12 ? 'AM' : 'PM';

            slots.push(`${hStr}:${mStr} ${ampm}`);

            currentMinutes += duracionMinutos;
        }

        this.horasDisponibles.set(slots);
    }

    //turnos

}
