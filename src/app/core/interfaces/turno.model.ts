export interface Turno {
    id: string;
    pacienteId: string;
    responsableId: string; // id del padre, tutor o persona que acompaña al paciente
    profesionalId?: string;  // si hay varios pediatras

    fecha: Date; // ISO
    hora: string; // HH:mm
    fechaString: string;
    horaString: string;
    motivo: string;

    estado: 'Pendiente' | 'Confirmado' | 'Atendido' | 'Cancelado';

    precioPagado: number;

    createdAt: Date;
}
