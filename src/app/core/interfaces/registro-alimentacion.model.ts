export type CategoriaAlimento = 'Fruta' | 'Vegetal' | 'Grano/Cereal' | 'Proteína' | 'Lácteo' | 'Otro';

export type TipoIngesta = 'Líquido' | 'Sólido' | 'Snack' | 'Suplemento';

export type ReaccionAlimento = 'Comió bien' | 'Rechazó' | 'Vomitó' | 'Normal';

export type UnidadMedida = 'ml' | 'oz' | 'cdas' | 'cdtas' | 'gramos' | 'unidad';

/**
 * Interface para el registro de alimentación de pacientes pediátricos
 */
export interface RegistroAlimentacion {
    id: string;
    pacienteId: string;

    // Información temporal
    fecha: Date;
    hora: string; // Formato HH:mm

    // Tipo de ingesta
    tipoIngesta: TipoIngesta;

    // Detalles del alimento
    categoria?: CategoriaAlimento;
    nombreAlimento: string;
    descripcion?: string; // Ej: "Similac Pro-Advance", "Puré casero"

    // Cantidad
    cantidad: number;
    unidadMedida: UnidadMedida;

    // Reacción del paciente
    reaccion?: ReaccionAlimento;

    // Información nutricional estimada (opcional)
    caloriasEstimadas?: number;

    // Notas adicionales
    notas?: string;

    // Registro de alergias detectadas
    causóReaccionAlergica?: boolean;

    // Metadata
    registradoPor?: string; // ID del usuario que registró (puede ser el responsable o un profesional)
    createdAt: Date;
    updatedAt?: Date;
}

/**
 * Interface para estadísticas diarias de alimentación
 */
export interface EstadisticasAlimentacionDiaria {
    fecha: Date;
    pacienteId: string;

    // Totales
    totalLiquidos: number; // en ml
    totalCalorias: number; // en kcal
    totalRegistros: number;

    // Desglose por tipo
    registrosPorTipo: {
        liquidos: number;
        solidos: number;
        snacks: number;
        suplementos: number;
    };

    // Metas
    metaLiquidos?: number; // en ml
    metaCalorias?: number; // en kcal

    // Última ingesta
    ultimaIngesta?: Date;
}
