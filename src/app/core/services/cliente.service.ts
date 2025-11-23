import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FirestoreService } from './firestore.service';
import { Router } from '@angular/router';
import { Cliente } from '../interfaces/cliente.model';
import { collection, Firestore, getDocs, query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private auth: Auth = inject(Auth);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private router: Router = inject(Router);
  private firestore: Firestore = inject(Firestore);

  // Metodo para el Registro
  async register({ email, password, apellido, nombre, documento }: any) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      const newCliente: Cliente = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        apellido,
        nombre,
        documento,
        emailVerified: firebaseUser.emailVerified
      };

      await this.firestoreService.setDocument('clientes', firebaseUser.uid, newCliente);

      return firebaseUser;

    } catch (error) {
      console.error('Error: en el register() ', error);
      alert('No se pudo completar el registro, es posble que el correo este en uso');
      throw error;
    }
  }

  async loginConDni(documento: string, password: string) {
    // 1. Buscamos el email del usuario por el DNI
    const q = query(
      collection(this.firestore, "clientes"),
      where("documento", "==", documento)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("No existe cliente con ese DNI");
    }

    const data = querySnapshot.docs[0].data();
    const email = data["email"];

    // 2. Hacemos login normal usando email/contraseña
    return signInWithEmailAndPassword(this.auth, email, password);
  }
}
