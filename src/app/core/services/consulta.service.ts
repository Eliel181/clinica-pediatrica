import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, doc, docData, DocumentReference, Firestore, query, updateDoc, where } from '@angular/fire/firestore';
import { Consulta } from '../interfaces/consulta.model';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConsultaService {

  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  currentUser = this.authService.currentUser;

  crearConsulta(consulta: Partial<Consulta>): Promise<DocumentReference> {
    const turnosCollection = collection(this.firestore, 'consultas');
    return addDoc(turnosCollection, consulta);
  }

  getConsultaById(id: string): Observable<Consulta | undefined> {
    const consultaDocRef = doc(this.firestore, `consultas/${id}`);
    return docData(consultaDocRef, { idField: 'id' }) as Observable<Consulta | undefined>;
  }

  getConsultasByPacienteId(pacienteId: string): Observable<Consulta[]> {
    const turnosCollection = collection(this.firestore, 'consultas');
    const q = query(
      turnosCollection,
      where('pacienteId', '==', pacienteId),
      where('profesionalId', '==', this.currentUser()?.uid)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Consulta[]>;

  }

  getAllConsultas(): Observable<Consulta[]> {
    const consultasCollection = collection(this.firestore, 'consultas');
    const q = query(consultasCollection); // Query all
    return collectionData(q, { idField: 'id' }) as Observable<Consulta[]>;
  }

  updateConsulta(id: string, consulta: Partial<Consulta>): Promise<void> {
    const consultaDocRef = doc(this.firestore, `consultas/${id}`);
    return updateDoc(consultaDocRef, consulta);
  }
}
