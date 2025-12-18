import { Component, inject, computed, effect, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-profile-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-user.component.html',
  styleUrl: './profile-user.component.css'
})
export class ProfileUserComponent {
  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private fb = inject(FormBuilder);
  private alert = inject(AlertService);

  // Signals
  currentUser = this.authService.currentUser;
  imagenBase64Preview: WritableSignal<string | null> = signal(null);

  profileForm: FormGroup;
  isSubmitting = false;

  // Computed
  hasUser = computed(() => !!this.currentUser());

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

    // Effect to patch form when user data is loaded
    effect(() => {
      const user = this.currentUser();
      if (user) {
        let birthDate = null;
        if (user.fechaNacimiento) {
          const dateObj = (user.fechaNacimiento as any).toDate
            ? (user.fechaNacimiento as any).toDate()
            : new Date(user.fechaNacimiento);

          if (!isNaN(dateObj.getTime())) {
            birthDate = dateObj.toISOString().split('T')[0];
          }
        }

        this.profileForm.patchValue({
          nombre: user.nombre,
          apellido: user.apellido,
          documento: user.documento,
          telefono: user.telefono || '',
          direccion: user.domicilio || '',
          fechaNacimiento: birthDate,
          genero: user.genero || '',
          imagenBase64: user.imagenBase64 || ''
        }, { emitEvent: false });

        this.imagenBase64Preview.set(user.imagenBase64 || null);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máx 500KB)
      if (file.size > 500 * 1024) {
        this.alert.open({
          title: 'Imagen demasiado pesada',
          message: 'La imagen seleccionada supera el límite de 500KB. Por favor seleccione una imagen más pequeña.',
          type: 'error'
        });
        event.target.value = ''; // Limpiar el input
        return;
      }

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

    const user = this.currentUser();
    if (!user || !user.uid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValues = this.profileForm.value;
      // Mapear direccion a domicilio y excluir direccion del objeto final
      const { direccion, ...otherValues } = formValues;

      const updatedData: Partial<Usuario> = {
        ...otherValues,
        domicilio: direccion,
        // Handle date conversion
        fechaNacimiento: formValues.fechaNacimiento ? new Date(formValues.fechaNacimiento) : undefined
      };

      // Update Firestore
      await this.firestoreService.updateDocument<Usuario>('usuarios', user.uid, updatedData);

      // Update local state
      this.authService.currentUser.set({
        ...user,
        ...updatedData
      } as Usuario);

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
