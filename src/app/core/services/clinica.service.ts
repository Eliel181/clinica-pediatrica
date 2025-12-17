import { inject, Injectable } from '@angular/core';
import { addDoc, arrayRemove, arrayUnion, collection, doc, DocumentReference, Firestore, getDoc, getDocs, limit, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Clinica, DiasNoAtencion } from '../interfaces/clinica.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicaService {
  private firestore: Firestore = inject(Firestore);

  async obtnerClinica(): Promise<Clinica | null> {
    const clinicaRef = collection(this.firestore, 'clinicas');
    const q = query(clinicaRef, limit(1));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Clinica;
    }

    return null;
  }

  crearClinica(clinica: Partial<Clinica>): Promise<DocumentReference> {
    const visitasCollection = collection(this.firestore, 'clinicas');
    return addDoc(visitasCollection, clinica);
  }

  updateClinica(id: string, clinica: Partial<Clinica>): Promise<void> {
    const evisitaDocRef = doc(this.firestore, `clinicas/${id}`);
    return updateDoc(evisitaDocRef, clinica);
  }

  /**
   * Agrega un nuevo día no laborable al array diasNoAtencion de la clínica
   * @param clinicaId ID del documento de la clínica
   * @param diaNoLaborable Objeto DiasNoAtencion a agregar
   */
  async agregarDiaNoLaborable(clinicaId: string, diaNoLaborable: DiasNoAtencion): Promise<void> {
    const clinicaDocRef = doc(this.firestore, `clinicas/${clinicaId}`);

    // Generar un ID único para el día no laborable si no tiene uno
    const diaConId = {
      ...diaNoLaborable,
      id: diaNoLaborable.id || crypto.randomUUID()
    };

    return updateDoc(clinicaDocRef, {
      diasNoAtencion: arrayUnion(diaConId)
    });
  }

  /**
   * Edita un día no laborable existente en el array diasNoAtencion
   * @param clinicaId ID del documento de la clínica
   * @param diaNoLaborable Objeto DiasNoAtencion con los datos actualizados (debe incluir el id)
   */
  async editarDiaNoLaborable(clinicaId: string, diaNoLaborable: DiasNoAtencion): Promise<void> {
    if (!diaNoLaborable.id) {
      throw new Error('El día no laborable debe tener un ID para poder editarlo');
    }

    const clinicaDocRef = doc(this.firestore, `clinicas/${clinicaId}`);

    // Obtener el documento actual
    const clinicaDoc = await getDoc(clinicaDocRef);
    if (!clinicaDoc.exists()) {
      throw new Error('No se encontró la clínica');
    }

    const clinicaData = clinicaDoc.data() as Clinica;
    const diasNoAtencion = clinicaData.diasNoAtencion || [];

    // Encontrar y reemplazar el día no laborable
    const index = diasNoAtencion.findIndex(dia => dia.id === diaNoLaborable.id);
    if (index === -1) {
      throw new Error('No se encontró el día no laborable a editar');
    }

    // Crear un nuevo array con el día actualizado
    const nuevoDiasNoAtencion = [...diasNoAtencion];
    nuevoDiasNoAtencion[index] = diaNoLaborable;

    return updateDoc(clinicaDocRef, {
      diasNoAtencion: nuevoDiasNoAtencion
    });
  }

  /**
   * Elimina un día no laborable del array diasNoAtencion
   * @param clinicaId ID del documento de la clínica
   * @param diaNoLaborableId ID del día no laborable a eliminar
   */
  async eliminarDiaNoLaborable(clinicaId: string, diaNoLaborableId: string): Promise<void> {
    const clinicaDocRef = doc(this.firestore, `clinicas/${clinicaId}`);

    // Obtener el documento actual
    const clinicaDoc = await getDoc(clinicaDocRef);
    if (!clinicaDoc.exists()) {
      throw new Error('No se encontró la clínica');
    }

    const clinicaData = clinicaDoc.data() as Clinica;
    const diasNoAtencion = clinicaData.diasNoAtencion || [];

    // Encontrar el día a eliminar
    const diaAEliminar = diasNoAtencion.find(dia => dia.id === diaNoLaborableId);
    if (!diaAEliminar) {
      throw new Error('No se encontró el día no laborable a eliminar');
    }

    // Eliminar usando arrayRemove
    return updateDoc(clinicaDocRef, {
      diasNoAtencion: arrayRemove(diaAEliminar)
    });
  }
}
