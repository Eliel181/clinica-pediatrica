export interface Consulta {
    id: string;
    pacienteId: string;
    responsableId: string;

    profesionalId: string;

    fecha: Date;

    motivoConsulta: string;

    // Pediatría
    peso?: number;
    talla?: number;
    perimetroCefalico?: number;
    temperatura?: number;

    imc?: number;

    diagnostico?: string;
    tratamiento?: string[];
    indicaciones?: string[];
    sintomas?: string[];

    requiereVacuna?: boolean;

    notas?: string;

    createdAt: Date;
}
