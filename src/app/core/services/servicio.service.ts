import { inject, Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Observable } from 'rxjs';
import { Servicio } from '../interfaces/servicio.model';

@Injectable({
    providedIn: 'root'
})
export class ServicioService {
    private firestoreService = inject(FirestoreService);
    private collectionName = 'servicios';

    getActiveServices(): Observable<Servicio[]> {
        return this.firestoreService.getCollectionByFilter<Servicio>(this.collectionName, 'activo', true as any);
    }
}
