export type ParentescoCliente = 'Hijo' | 'Nieto';

export interface Paciente {
    id: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string; // ISO
    dni: string;
    sexo: 'Masculino' | 'Femenino' | 'Otro';
    parentesco?: ParentescoCliente;

    responsableId: string;   // ID del cliente (tutor legal)
    coberturaId?: string;    // obra social / prepaga
    nroAfiliado?: string;

    alergias?: string[];
    enfermedadesCronicas?: string[];

    notas?: string;
    createdAt: Date;
}
