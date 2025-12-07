export interface Servicio {
    id: string;

    nombre: string;
    categoria:
    | 'Consulta'
    | 'Control'
    | 'Vacuna'
    | 'Estudio'
    | 'Laboratorio'
    | 'Especialidad'
    | 'Administrativo'
    | 'Otro';

    descripcion?: string;

    duracionMinutos?: number;    // duración típica del servicio

    profesionalRequerido?: boolean;  // si necesita médico
    especialidad?: string;           // opcional: Ej "Neumonología"

    requiereAyuno?: boolean;
    requiereAutorizacion?: boolean;  // Obra social
    edadMin?: number;                // meses
    edadMax?: number;                // meses

    precio?: number;                 // opcional, si usás facturación

    activo: boolean;                 // para habilitar/deshabilitar

    creadoEl: string;                // ISO
}
