import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { Usuario } from '../interfaces/usuario.model';

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private firestoreService = inject(FirestoreService);
    private collectionName = 'usuarios';

    getPediatrasByServicio(servicioId: string): Observable<Usuario[]> {
        return this.firestoreService.getCollectionByFilter<Usuario>(this.collectionName, 'servicioId', servicioId);
    }
}
