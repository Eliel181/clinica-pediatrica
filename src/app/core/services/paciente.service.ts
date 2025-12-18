import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Observable } from 'rxjs';
import { Paciente } from '../interfaces/paciente.model';

@Injectable({
    providedIn: 'root'
})
export class PacienteService {
    private firestoreService = inject(FirestoreService);
    private collectionName = 'pacientes';

    getAllPacientes(): Observable<Paciente[]> {
        return this.firestoreService.getCollection<Paciente>(this.collectionName);
    }

    getPacientesByResponsable(responsableId: string): Observable<Paciente[]> {
        return this.firestoreService.getCollectionByFilter<Paciente>(this.collectionName, 'responsableId', responsableId);
    }

    addPaciente(paciente: Paciente): Promise<any> {
        return this.firestoreService.addDocument(this.collectionName, {
            ...paciente,
            createdAt: new Date()
        });
    }

    updatePaciente(id: string, paciente: Partial<Paciente>): Promise<void> {
        return this.firestoreService.updateDocument(this.collectionName, id, paciente);
    }

    deletePaciente(id: string): Promise<void> {
        return this.firestoreService.deleteDocument(this.collectionName, id);
    }

    async getPacienteById(id: string): Promise<Paciente | undefined> {
        return this.firestoreService.getDocument<Paciente>(this.collectionName, id);
    }
}
