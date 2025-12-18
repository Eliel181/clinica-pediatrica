// Esquema Nacional de Vacunación Pediátrica
export interface VacunaEsquema {
    nombre: string;
    dosis: string;
    edadRecomendada: string;
    edadMeses: number; // Para cálculos
    descripcion?: string;
}

export const ESQUEMA_VACUNACION: VacunaEsquema[] = [
    // Recién nacido
    {
        nombre: 'BCG',
        dosis: 'Única',
        edadRecomendada: 'Recién nacido',
        edadMeses: 0,
        descripcion: 'Tuberculosis'
    },
    {
        nombre: 'Hepatitis B',
        dosis: '1°',
        edadRecomendada: 'Recién nacido',
        edadMeses: 0,
        descripcion: 'Hepatitis B'
    },

    // 2 meses
    {
        nombre: 'Pentavalente',
        dosis: '1°',
        edadRecomendada: '2 meses',
        edadMeses: 2,
        descripcion: 'DTP + Hib + Hepatitis B'
    },
    {
        nombre: 'Polio IPV',
        dosis: '1°',
        edadRecomendada: '2 meses',
        edadMeses: 2,
        descripcion: 'Poliomielitis inactivada'
    },
    {
        nombre: 'Rotavirus',
        dosis: '1°',
        edadRecomendada: '2 meses',
        edadMeses: 2,
        descripcion: 'Gastroenteritis por rotavirus'
    },
    {
        nombre: 'Neumococo',
        dosis: '1°',
        edadRecomendada: '2 meses',
        edadMeses: 2,
        descripcion: 'Neumococo conjugada'
    },

    // 4 meses
    {
        nombre: 'Pentavalente',
        dosis: '2°',
        edadRecomendada: '4 meses',
        edadMeses: 4,
        descripcion: 'DTP + Hib + Hepatitis B'
    },
    {
        nombre: 'Polio IPV',
        dosis: '2°',
        edadRecomendada: '4 meses',
        edadMeses: 4,
        descripcion: 'Poliomielitis inactivada'
    },
    {
        nombre: 'Rotavirus',
        dosis: '2°',
        edadRecomendada: '4 meses',
        edadMeses: 4,
        descripcion: 'Gastroenteritis por rotavirus'
    },
    {
        nombre: 'Neumococo',
        dosis: '2°',
        edadRecomendada: '4 meses',
        edadMeses: 4,
        descripcion: 'Neumococo conjugada'
    },

    // 6 meses
    {
        nombre: 'Pentavalente',
        dosis: '3°',
        edadRecomendada: '6 meses',
        edadMeses: 6,
        descripcion: 'DTP + Hib + Hepatitis B'
    },
    {
        nombre: 'Polio IPV',
        dosis: '3°',
        edadRecomendada: '6 meses',
        edadMeses: 6,
        descripcion: 'Poliomielitis inactivada'
    },
    {
        nombre: 'Influenza',
        dosis: '1°',
        edadRecomendada: '6 meses',
        edadMeses: 6,
        descripcion: 'Gripe estacional'
    },

    // 7 meses
    {
        nombre: 'Influenza',
        dosis: '2°',
        edadRecomendada: '7 meses',
        edadMeses: 7,
        descripcion: 'Gripe estacional (refuerzo)'
    },

    // 12 meses
    {
        nombre: 'Triple Viral',
        dosis: '1°',
        edadRecomendada: '12 meses',
        edadMeses: 12,
        descripcion: 'Sarampión, Rubéola, Parotiditis'
    },
    {
        nombre: 'Neumococo',
        dosis: 'Refuerzo',
        edadRecomendada: '12 meses',
        edadMeses: 12,
        descripcion: 'Neumococo conjugada'
    },
    {
        nombre: 'Hepatitis A',
        dosis: 'Única',
        edadRecomendada: '12 meses',
        edadMeses: 12,
        descripcion: 'Hepatitis A'
    },

    // 15 meses
    {
        nombre: 'Varicela',
        dosis: '1°',
        edadRecomendada: '15 meses',
        edadMeses: 15,
        descripcion: 'Varicela'
    },

    // 18 meses
    {
        nombre: 'DTP',
        dosis: 'Refuerzo',
        edadRecomendada: '18 meses',
        edadMeses: 18,
        descripcion: 'Difteria, Tétanos, Pertussis'
    },
    {
        nombre: 'Polio OPV',
        dosis: 'Refuerzo',
        edadRecomendada: '18 meses',
        edadMeses: 18,
        descripcion: 'Poliomielitis oral'
    },

    // 5 años
    {
        nombre: 'DTP',
        dosis: '2° Refuerzo',
        edadRecomendada: '5 años',
        edadMeses: 60,
        descripcion: 'Difteria, Tétanos, Pertussis'
    },
    {
        nombre: 'Polio OPV',
        dosis: '2° Refuerzo',
        edadRecomendada: '5 años',
        edadMeses: 60,
        descripcion: 'Poliomielitis oral'
    },
    {
        nombre: 'Triple Viral',
        dosis: '2°',
        edadRecomendada: '5 años',
        edadMeses: 60,
        descripcion: 'Sarampión, Rubéola, Parotiditis'
    },
    {
        nombre: 'Varicela',
        dosis: '2°',
        edadRecomendada: '5 años',
        edadMeses: 60,
        descripcion: 'Varicela'
    },

    // 11 años
    {
        nombre: 'Triple Bacteriana',
        dosis: 'Refuerzo',
        edadRecomendada: '11 años',
        edadMeses: 132,
        descripcion: 'Difteria, Tétanos, Pertussis acelular'
    },
    {
        nombre: 'VPH',
        dosis: '1°',
        edadRecomendada: '11 años',
        edadMeses: 132,
        descripcion: 'Virus del Papiloma Humano'
    },
    {
        nombre: 'VPH',
        dosis: '2°',
        edadRecomendada: '11 años (6 meses después)',
        edadMeses: 138,
        descripcion: 'Virus del Papiloma Humano'
    },
    {
        nombre: 'Meningococo',
        dosis: 'Única',
        edadRecomendada: '11 años',
        edadMeses: 132,
        descripcion: 'Meningococo ACWY'
    },
    {
        nombre: 'Fiebre Amarilla',
        dosis: 'Única',
        edadRecomendada: '11 años (zonas de riesgo)',
        edadMeses: 132,
        descripcion: 'Fiebre Amarilla'
    }
];

/**
 * Calcula la edad en meses de un paciente
 */
export function calcularEdadEnMeses(fechaNacimiento: Date): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let meses = (hoy.getFullYear() - nacimiento.getFullYear()) * 12;
    meses += hoy.getMonth() - nacimiento.getMonth();

    // Ajustar si el día actual es menor que el día de nacimiento
    if (hoy.getDate() < nacimiento.getDate()) {
        meses--;
    }

    return meses;
}

/**
 * Determina qué vacunas le corresponden al paciente según su edad
 */
export function obtenerVacunasCorrespondientes(edadMeses: number): VacunaEsquema[] {
    return ESQUEMA_VACUNACION.filter(v => v.edadMeses <= edadMeses);
}

/**
 * Determina la próxima vacuna que le corresponde al paciente
 */
export function obtenerProximaVacuna(edadMeses: number): VacunaEsquema | null {
    const proximasVacunas = ESQUEMA_VACUNACION.filter(v => v.edadMeses > edadMeses);
    return proximasVacunas.length > 0 ? proximasVacunas[0] : null;
}

/**
 * Compara las vacunas aplicadas con el esquema para determinar cuáles faltan
 */
export function obtenerVacunasPendientes(
    edadMeses: number,
    vacunasAplicadas: Array<{ vacunaNombre: string; dosis: string }>
): VacunaEsquema[] {
    const vacunasCorrespondientes = obtenerVacunasCorrespondientes(edadMeses);

    return vacunasCorrespondientes.filter(esquema => {
        // Buscar si esta vacuna con esta dosis ya fue aplicada
        const yaAplicada = vacunasAplicadas.some(aplicada =>
            aplicada.vacunaNombre.toLowerCase().includes(esquema.nombre.toLowerCase()) &&
            aplicada.dosis === esquema.dosis
        );
        return !yaAplicada;
    });
}
