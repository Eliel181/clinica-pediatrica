import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, DocumentReference, Firestore, query, updateDoc } from '@angular/fire/firestore';
import { Vacuna } from '../interfaces/vacuna.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VacunaService {

  private firestore: Firestore = inject(Firestore);

  crearVacuna(vacuna: Partial<Vacuna>): Promise<DocumentReference> {
    const vacunasCollection = collection(this.firestore, 'vacunas');
    return addDoc(vacunasCollection, vacuna);
  }

  getVacunaById(id: string): Observable<Vacuna | undefined> {
    const vacunaDocRef = doc(this.firestore, `vacunas/${id}`);
    return docData(vacunaDocRef, { idField: 'id' }) as Observable<Vacuna | undefined>;
  }

  updateVacuna(id: string, vacuna: Partial<Vacuna>): Promise<void> {
    const vacunaDocRef = doc(this.firestore, `vacunas/${id}`);
    return updateDoc(vacunaDocRef, vacuna);
  }

  getAllVacunas(): Observable<Vacuna[]> {
    const vacunasCollection = collection(this.firestore, 'vacunas');
    const q = query(vacunasCollection); // Query all
    return collectionData(q, { idField: 'id' }) as Observable<Vacuna[]>;
  }
}
