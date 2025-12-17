import { Timestamp } from "@angular/fire/firestore";

export interface Clinica {
    id?: string;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    logoBase64: string;
    horarioAtencion: string;
    diasNoAtencion: DiasNoAtencion[];
}

export interface DiasNoAtencion {
    id?: string;
    dia: string;
    fecha: string;
    motivo: string;
    fechaFirebase: Timestamp;
}

