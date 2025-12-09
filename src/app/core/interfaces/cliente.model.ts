
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
    imagenBase64?: string;

    emailVerified?: boolean;
    completoDatos: boolean; //si el cliente no completa los datos, este campo permanecera en false
}
