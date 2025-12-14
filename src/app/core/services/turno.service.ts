import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, docData, DocumentReference, Firestore, updateDoc, query, where, getDocs, collectionData } from '@angular/fire/firestore';
import { Turno } from '../interfaces/turno.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {

  private firestore: Firestore = inject(Firestore);

  crearTurno(turno: Partial<Turno>): Promise<DocumentReference> {
    const turnosCollection = collection(this.firestore, 'turnos');
    return addDoc(turnosCollection, turno);
  }

  getTurnoById(id: string): Observable<Turno | undefined> {
    const turnoDocRef = doc(this.firestore, `turnos/${id}`);
    return docData(turnoDocRef, { idField: 'id' }) as Observable<Turno | undefined>;
  }

  getTurnosByClienteId(clienteId: string): Observable<Turno[]> {
    const turnosCollection = collection(this.firestore, 'turnos');
    const q = query(
      turnosCollection,
      where('responsableId', '==', clienteId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;

  }

  getAllTurnos(): Observable<Turno[]> {
    const turnosCollection = collection(this.firestore, 'turnos');
    const q = query(turnosCollection); // Query all
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  updateTurno(id: string, turno: Partial<Turno>): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${id}`);
    return updateDoc(turnoDocRef, turno);
  }

  async getTurnosByProfesionalAndFecha(profesionalId: string, fechaString: string): Promise<Turno[]> {
    try {
      console.log('Querying turnos for:', { profesionalId, fechaString });

      const turnosCollection = collection(this.firestore, 'turnos');
      const q = query(
        turnosCollection,
        where('profesionalId', '==', profesionalId),
        where('fechaString', '==', fechaString)
      );

      const querySnapshot = await getDocs(q);
      console.log('Query returned', querySnapshot.size, 'documents');

      const turnos = querySnapshot.docs.map(doc => doc.data() as Turno);

      // Filter out canceled appointments in memory
      const activeTurnos = turnos.filter(t => t.estado !== 'Cancelado');
      console.log('Active turnos:', activeTurnos);

      return activeTurnos;
    } catch (error) {
      console.error('Error in getTurnosByProfesionalAndFecha:', error);
      return [];
    }
  }

  async cancelarTurno(id: string): Promise<void> {
    await this.updateTurno(id, {
      estado: 'Cancelado',
    } as Turno);
  }

  async getTurnosPorDia(fecha: Date): Promise<Turno[]> {
    const turnosCollection = collection(this.firestore, 'turnos');
    const q = query(turnosCollection, where('fecha', '==', fecha));

    const snaps = await getDocs(q);
    return snaps.docs.map((d) => {
      const data: any = d.data();
      return {
        ...data,
        fecha: data.fecha,
        createdAt: data.createdAt
      } as Turno;
    });
  }

  getTurnosByDateRange(fechaDesde?: string, fechaHasta?: string): Observable<Turno[]> {
    const turnosCollection = collection(this.firestore, 'turnos');

    // Si no hay filtros de fecha, retornar todos
    if (!fechaDesde && !fechaHasta) {
      return collectionData(turnosCollection, { idField: 'id' }) as Observable<Turno[]>;
    }

    // Construir query con filtros de fecha
    const constraints = [];

    if (fechaDesde) {
      // Convertir string YYYY-MM-DD a Date para comparar con Firestore Timestamp
      const fechaDesdeDate = new Date(fechaDesde);
      fechaDesdeDate.setHours(0, 0, 0, 0); // Inicio del día
      constraints.push(where('fecha', '>=', fechaDesdeDate));
    }

    if (fechaHasta) {
      // Convertir string YYYY-MM-DD a Date para comparar con Firestore Timestamp
      const fechaHastaDate = new Date(fechaHasta);
      fechaHastaDate.setHours(23, 59, 59, 999); // Fin del día
      constraints.push(where('fecha', '<=', fechaHastaDate));
    }

    const q = query(turnosCollection, ...constraints);
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

}

