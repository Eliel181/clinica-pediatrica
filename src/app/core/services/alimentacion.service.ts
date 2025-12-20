import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, DocumentReference, Firestore, query, updateDoc, where, orderBy } from '@angular/fire/firestore';
import { RegistroAlimentacion, EstadisticasAlimentacionDiaria } from '../interfaces/registro-alimentacion.model';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AlimentacionService {
    private firestore: Firestore = inject(Firestore);
    private collectionName = 'registros-alimentacion';

    /**
     * Crear un nuevo registro de alimentación
     */
    crearRegistro(registro: Partial<RegistroAlimentacion>): Promise<DocumentReference> {
        const registrosCollection = collection(this.firestore, this.collectionName);
        const registroConFecha = {
            ...registro,
            createdAt: new Date(),
            fecha: registro.fecha || new Date()
        };
        return addDoc(registrosCollection, registroConFecha);
    }

    /**
     * Obtener un registro por ID
     */
    getRegistroById(id: string): Observable<RegistroAlimentacion | undefined> {
        const registroDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return docData(registroDocRef, { idField: 'id' }) as Observable<RegistroAlimentacion | undefined>;
    }

    getRegistrosByPacienteId(pacienteId: string): Observable<RegistroAlimentacion[]> {
        const registrosCollection = collection(this.firestore, this.collectionName);
        const q = query(
            registrosCollection,
            where('pacienteId', '==', pacienteId)
        );
        return collectionData(q, { idField: 'id' }) as Observable<RegistroAlimentacion[]>;
    }

    /**
     * Obtener registros de un paciente para una fecha específica
     */
    getRegistrosByPacienteYFecha(pacienteId: string, fecha: Date): Observable<RegistroAlimentacion[]> {
        const startOfDay = new Date(fecha);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(fecha);
        endOfDay.setHours(23, 59, 59, 999);

        const registrosCollection = collection(this.firestore, this.collectionName);
        const q = query(
            registrosCollection,
            where('pacienteId', '==', pacienteId)
        );

        // Filtrar por fecha en el cliente para evitar índices compuestos
        return collectionData(q, { idField: 'id' }).pipe(
            map((registros: any[]) => {
                return registros.filter(r => {
                    const fechaRegistro = r.fecha?.toDate ? r.fecha.toDate() : new Date(r.fecha);
                    return fechaRegistro >= startOfDay && fechaRegistro <= endOfDay;
                });
            })
        ) as Observable<RegistroAlimentacion[]>;
    }

    updateRegistro(id: string, registro: Partial<RegistroAlimentacion>): Promise<void> {
        const registroDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return updateDoc(registroDocRef, {
            ...registro,
            updatedAt: new Date()
        });
    }

    deleteRegistro(id: string): Promise<void> {
        const registroDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
        return deleteDoc(registroDocRef);
    }

    /**
     * Calcular estadísticas diarias de alimentación
     */
    calcularEstadisticasDiarias(registros: RegistroAlimentacion[]): EstadisticasAlimentacionDiaria {
        const totalLiquidos = registros
            .filter(r => r.tipoIngesta === 'Líquido')
            .reduce((sum, r) => {
                // Convertir a ml si es necesario
                let ml = r.cantidad;
                if (r.unidadMedida === 'oz') {
                    ml = r.cantidad * 29.5735; // 1 oz = 29.5735 ml
                }
                return sum + ml;
            }, 0);

        const totalCalorias = registros
            .reduce((sum, r) => sum + (r.caloriasEstimadas || 0), 0);

        const registrosPorTipo = {
            liquidos: registros.filter(r => r.tipoIngesta === 'Líquido').length,
            solidos: registros.filter(r => r.tipoIngesta === 'Sólido').length,
            snacks: registros.filter(r => r.tipoIngesta === 'Snack').length,
            suplementos: registros.filter(r => r.tipoIngesta === 'Suplemento').length
        };

        // Encontrar la última ingesta
        const ultimaIngesta = registros.length > 0
            ? registros.sort((a, b) => {
                const fechaA = new Date(a.fecha).getTime();
                const fechaB = new Date(b.fecha).getTime();
                return fechaB - fechaA;
            })[0].fecha
            : undefined;

        return {
            fecha: new Date(),
            pacienteId: registros[0]?.pacienteId || '',
            totalLiquidos: Math.round(totalLiquidos),
            totalCalorias: Math.round(totalCalorias),
            totalRegistros: registros.length,
            registrosPorTipo,
            ultimaIngesta
        };
    }
}
