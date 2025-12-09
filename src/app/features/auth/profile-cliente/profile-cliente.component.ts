import { Component, inject, computed, effect, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Cliente } from '../../../core/interfaces/cliente.model';
import { AlertService } from '../../../core/services/alert.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { Paciente } from '../../../core/interfaces/paciente.model';

@Component({
  selector: 'app-profile-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-cliente.component.html',
  styleUrl: './profile-cliente.component.css'
})
export class ProfileClienteComponent {
  private clienteService = inject(ClienteService);
  private firestoreService = inject(FirestoreService);
  private pacienteService = inject(PacienteService);
  private fb = inject(FormBuilder);
  private alert = inject(AlertService);

  // Signals
  currentClient = this.clienteService.currentClient;
  imagenBase64Preview: WritableSignal<string | null> = signal(null);
  pacientes: WritableSignal<Paciente[]> = signal([]);

  // Modal State
  showModal = signal(false);
  isEditing = signal(false);
  selectedPacienteId: string | null = null;

  profileForm: FormGroup;
  pacienteForm: FormGroup;
  isSubmitting = false;
  isSubmittingPaciente = false; // Separate loading state for patient form

  // Computed
  hasClient = computed(() => !!this.currentClient());

  constructor() {
    this.profileForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      documento: ['', Validators.required],
      telefono: [''],
      direccion: [''],
      fechaNacimiento: [null],
      genero: [''],
      imagenBase64: ['']
    });

    this.pacienteForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      parentesco: ['Padre', Validators.required], // Default value
      nroAfiliado: [''],
      alergias: [''], // Simple string input for now, could be improved
      enfermedadesCronicas: [''],
      notas: ['']
    });

    // Effect to patch form when client data is loaded and fetch patients
    effect(() => {
      const client = this.currentClient();
      if (client) {
        let birthDate = null;
        if (client.fechaNacimiento) {
          const dateObj = (client.fechaNacimiento as any).toDate
            ? (client.fechaNacimiento as any).toDate()
            : new Date(client.fechaNacimiento);

          if (!isNaN(dateObj.getTime())) {
            birthDate = dateObj.toISOString().split('T')[0];
          }
        }

        this.profileForm.patchValue({
          nombre: client.nombre,
          apellido: client.apellido,
          documento: client.documento,
          telefono: client.telefono || '',
          direccion: client.direccion || '',
          fechaNacimiento: birthDate,
          genero: client.genero || '',
          imagenBase64: client.imagenBase64 || ''
        }, { emitEvent: false });

        this.imagenBase64Preview.set(client.imagenBase64 || null);

        if (client.id) {
          this.loadPacientes(client.id);
        }
      }
    });
  }

  loadPacientes(clientId: string) {
    this.pacienteService.getPacientesByResponsable(clientId).subscribe({
      next: (data) => {
        this.pacientes.set(data);
      },
      error: (err) => {
        console.error('Error loading patients', err);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.imagenBase64Preview.set(result);
        this.profileForm.patchValue({ imagenBase64: result });
        this.profileForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) return;

    const client = this.currentClient();
    if (!client || !client.id) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValues = this.profileForm.value;
      const updatedData: Partial<Cliente> = {
        ...formValues,
        // Handle date conversion
        fechaNacimiento: formValues.fechaNacimiento ? new Date(formValues.fechaNacimiento) : undefined
      };

      // Update Firestore
      await this.firestoreService.updateDocument<Cliente>('clientes', client.id, updatedData);

      // Update local state
      this.clienteService.currentClient.set({
        ...client,
        ...updatedData
      } as Cliente);

      this.alert.open({
        title: 'Correcto',
        message: 'Perfil Actualizado Exitosamente',
        type: 'success'
      });

      this.profileForm.markAsPristine();

    } catch (error) {
      console.error('Error al modificar el perfil', error);
      this.alert.open({
        title: 'Error',
        message: 'Hubo un error al actualizar el perfil',
        type: 'error'
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  // --- Paciente Management Methods ---

  openAddPacienteModal() {
    this.isEditing.set(false);
    this.selectedPacienteId = null;
    this.pacienteForm.reset({
      parentesco: 'Padre', // Reset to default
      sexo: ''
    });
    this.showModal.set(true);
  }

  openEditPacienteModal(paciente: Paciente) {
    this.isEditing.set(true);
    this.selectedPacienteId = paciente.id;

    this.pacienteForm.patchValue({
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni,
      fechaNacimiento: paciente.fechaNacimiento,
      sexo: paciente.sexo,
      parentesco: paciente.parentesco,
      nroAfiliado: paciente.nroAfiliado || '',
      alergias: paciente.alergias ? paciente.alergias.join(', ') : '', // Assuming simple implementation
      enfermedadesCronicas: paciente.enfermedadesCronicas ? paciente.enfermedadesCronicas.join(', ') : '',
      notas: paciente.notas || ''
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.pacienteForm.reset();
  }

  async onPacienteSubmit() {
    if (this.pacienteForm.invalid) return;

    const client = this.currentClient();
    if (!client || !client.id) return;

    this.isSubmittingPaciente = true;

    try {
      const formValues = this.pacienteForm.value;

      // Basic transformation for array fields (comma separated string -> array)
      const alergiasArray = formValues.alergias ? formValues.alergias.split(',').map((s: string) => s.trim()) : [];
      const enfermedadesArray = formValues.enfermedadesCronicas ? formValues.enfermedadesCronicas.split(',').map((s: string) => s.trim()) : [];

      const pacienteData: any = {
        ...formValues,
        responsableId: client.id,
        alergias: alergiasArray,
        enfermedadesCronicas: enfermedadesArray
      };

      if (this.isEditing() && this.selectedPacienteId) {
        await this.pacienteService.updatePaciente(this.selectedPacienteId, pacienteData);
        this.alert.open({ title: 'Éxito', message: 'Paciente actualizado correctamente', type: 'success' });
      } else {
        await this.pacienteService.addPaciente(pacienteData as Paciente);
        this.alert.open({ title: 'Éxito', message: 'Paciente agregado correctamente', type: 'success' });
      }

      this.closeModal();
      // List updates automatically via subscription in loadPacientes? 
      // Not exactly, if FirestoreService.getCollectionByFilter returns an observable that stays open (collectionData), it updates auto.
      // Yes, collectionData is real-time.

    } catch (error) {
      console.error('Error saving paciente', error);
      this.alert.open({ title: 'Error', message: 'Error al guardar el paciente', type: 'error' });
    } finally {
      this.isSubmittingPaciente = false;
    }
  }

  async deletePaciente(id: string) {
    if (!confirm('¿Está seguro de que desea eliminar este paciente?')) return;

    try {
      await this.pacienteService.deletePaciente(id);
      this.alert.open({ title: 'Eliminado', message: 'Paciente eliminado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error deleting paciente', error);
      this.alert.open({ title: 'Error', message: 'Error al eliminar el paciente', type: 'error' });
    }
  }
}

