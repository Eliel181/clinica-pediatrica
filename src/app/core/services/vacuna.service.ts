import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, DocumentReference, Firestore, query, updateDoc, where } from '@angular/fire/firestore';
import { Vacuna } from '../interfaces/vacuna.model';
import { Observable } from 'rxjs';
import { VacunaAplicada } from '../interfaces/vacuna-aplicada.model';

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

  //eventos para gestionar vacunas aplicadas
  crearVacunaAplicada(vacunaAplicada: Partial<VacunaAplicada>): Promise<DocumentReference> {
    const vacunasAplicadasCollection = collection(this.firestore, 'vacunas-aplicadas');
    return addDoc(vacunasAplicadasCollection, vacunaAplicada);
  }

  getAllVacunasAplicadas(): Observable<VacunaAplicada[]> {
    const vacunasAplicadasCollection = collection(this.firestore, 'vacunas-aplicadas');
    const q = query(vacunasAplicadasCollection); // Query all
    return collectionData(q, { idField: 'id' }) as Observable<VacunaAplicada[]>;
  }

  getAllVacunasAplicadasByPacienteId(pacienteId: string): Observable<VacunaAplicada[]> {
    const vacunasAplicadasCollection = collection(this.firestore, 'vacunas-aplicadas');
    const q = query(vacunasAplicadasCollection, where('pacienteId', '==', pacienteId));
    return collectionData(q, { idField: 'id' }) as Observable<VacunaAplicada[]>;
  }
}
