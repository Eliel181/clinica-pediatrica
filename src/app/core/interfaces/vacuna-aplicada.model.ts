export interface VacunaAplicada {
    id: string;

    pacienteId: string;
    aplicadaPor: string;

    vacunaNombre: string;
    dosis: string;

    fechaAplicacion: Date;

    insumoVacunaId: string;   //lote usado
    lote: string;

    profesionalId: string;

    observaciones?: string;
}
