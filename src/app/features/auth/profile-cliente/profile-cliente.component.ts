import { Component, inject, computed, effect, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Cliente } from '../../../core/interfaces/cliente.model';
import { AlertService } from '../../../core/services/alert.service';

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
  private fb = inject(FormBuilder);
  private alert = inject(AlertService);

  // Signals
  currentClient = this.clienteService.currentClient;
  imagenBase64Preview: WritableSignal<string | null> = signal(null);

  profileForm: FormGroup;
  isSubmitting = false;

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

    // Effect to patch form when client data is loaded (Reactive alternative to ngOnInit)
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
}
