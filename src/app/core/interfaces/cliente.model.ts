export type ParentescoCliente = 'Padre' | 'Madre' | 'Tutor Legal';

export interface Cliente {
    id?: string;
    nombre: string;
    apellido: string;
    documento: string;
    telefono?: string;
    email: string;
    direccion?: string;
    fechaNacimiento?: Date;
    genero?: string;
    parentesco?: ParentescoCliente;
    imagenBase64?: string;

    emailVerified?: boolean;
}
