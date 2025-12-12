import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, docData, DocumentReference, Firestore, updateDoc, query, where, getDocs } from '@angular/fire/firestore';
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
}
