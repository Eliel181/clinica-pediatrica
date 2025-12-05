import { Timestamp } from "@angular/fire/firestore";
import { Imagen } from "./imagen.model";

export interface Clinica {
    id?: string;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    logo: Imagen;
    horarioAtencion: string;
    servicios: string[];
    imagenPrincipal?: Imagen;
    imagenSecundaria?: Imagen;
    diasNoAtencion: DiasNoAtencion[];
}

export interface DiasNoAtencion {
    id?: string;
    dia: string;
    fecha: string;
    motivo: string;
    fechaFirebase: Timestamp;
}

