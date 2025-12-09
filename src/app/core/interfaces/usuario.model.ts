export type RolUsuario = 'Empleado' | 'Pediatra' | 'Admin' | 'Recepcionista';

export interface Usuario {
    uid: string;
    email: string;
    telefono: string;
    apellido: string;
    nombre: string;
    documento: string;
    genero: string;
    fechaNacimiento: string;
    fechaAlta: Date;
    domicilio: string;
    turno: string;
    horasTrabajo: string;
    matricula?: string;
    Estado: 'Activo' | 'Inactivo';
    rol: RolUsuario;
    imagenBase64?: string;
    emailVerified?: boolean;
    servicioId?: string; //Id del servicio al que pertenece el usuario

    firstLogin?: boolean;
    online?: boolean;
    lastSeen?: any;

    createdAt?: Date;
    updatedAt?: Date;
    whoCreated?: string; //Nombre y Apellido del usuario que lo creo
}

