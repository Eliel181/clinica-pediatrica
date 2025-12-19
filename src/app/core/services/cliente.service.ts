import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '@angular/fire/auth';
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
  currentClient: WritableSignal<Cliente | null | undefined> = signal(undefined);

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtenemos el cliente de Firestore
        const client = await this.firestoreService.getDocument<Cliente>('clientes', firebaseUser.uid);

        // Si existe el cliente, actualizamos el signal
        if (client) {
          const clientWithVerificationStatus: Cliente = {
            ...client,
            emailVerified: firebaseUser.emailVerified
          };
          this.currentClient.set(clientWithVerificationStatus);
        } else {
          // Si no es un cliente (podria ser un usuario administrativo), no seteamos currentClient
          // O podriamos setearlo a null si queremos asegurar que no haya datos basura
          // this.currentClient.set(null); 
          // (Dejamos undefined o null segun la logica deseada, aqui asumimos que si no es cliente no interferimos o null)
          this.currentClient.set(null);
        }
      } else {
        this.currentClient.set(null);
      }
    });
  }

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
        emailVerified: firebaseUser.emailVerified,
        completoDatos: false
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
    const clientCredential = await signInWithEmailAndPassword(this.auth, email, password);
    const cliente = clientCredential.user;

    //verificamos que el cliente este verificado
    const appClient = await this.firestoreService.getDocument<Cliente>('clientes', cliente!.uid);

    if (!appClient) {
      throw new Error('No se encontraron datos del cliente en la base de datos.');
    }

    //si el cliente no esta verificado, lo marcamos como verificado
    if (cliente.emailVerified && appClient.emailVerified !== true) {
      await this.firestoreService.updateDocument('clientes', cliente.uid, { emailVerified: true });
    }

    const clientWithVerificationStatus: Cliente = {
      ...appClient!,
      emailVerified: cliente.emailVerified
    };

    this.currentClient.set(clientWithVerificationStatus || null);
  }

  // Metodo para enviar un email de confirmacion
  async sendEmailVerification(): Promise<void> {
    const firebaseUser = this.auth.currentUser;

    if (!firebaseUser) {
      throw new Error('No hay cliente autenticado');
    }
    if (firebaseUser.emailVerified) {
      throw new Error('No hay cliente autenticado');
    }
    try {
      await sendEmailVerification(firebaseUser);
      //console.log(`Correo de verificación enviado a: ${firebaseUser.email}`);
    } catch (error) {
      //console.error('Error al enviar verificación:', error);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  async logOut() {
    await signOut(this.auth);
    this.currentClient.set(null);
    this.router.navigate(['/portal-cliente']);
  }

  async getClienteById(id: string): Promise<Cliente | undefined> {
    return this.firestoreService.getDocument<Cliente>('clientes', id);
  }
}
