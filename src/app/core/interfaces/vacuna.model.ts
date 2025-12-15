export interface Vacuna {
    id: string;

    nombreComercial: string;
    vacuna: string; // Ej: Hepatitis B

    laboratorio: string;
    lote: string;
    fechaVencimiento: Date;

    cantidadTotal: number;
    cantidadDisponible: number;

    dosisPorUnidad?: number;

    temperaturaMin: number; // Ej: 2
    temperaturaMax: number; // Ej: 8

    proveedor?: string;

    fechaIngreso: Date;
    recibidoPor?: string; //nombre y apellido del empleado que recibio la vacuna

    observaciones?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

