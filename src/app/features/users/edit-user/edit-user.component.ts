import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { Servicio } from '../../../core/interfaces/servicio.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private firestoreService = inject(FirestoreService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertService = inject(AlertService);

  userForm: FormGroup;
  userId: string = '';
  currentUser = signal<Usuario | null>(null);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);

  // Para pediatras
  servicios = signal<Servicio[]>([]);
  categoriasServicio: string[] = ['Consulta', 'Control', 'Vacuna', 'Estudio', 'Laboratorio', 'Especialidad', 'Administrativo', 'Otro'];
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  constructor() {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required], // Mapped from 'documento'
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]], // Email usually not editable directly
      telefono: ['', Validators.required],
      rol: ['', Validators.required],
      servicioId: [''], // Only for Pediatra
      diasAtencion: [[]] // Only for Pediatra
    });
  }

  async ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.userId) {
      this.router.navigate(['/gestion-usuarios']);
      return;
    }

    try {
      await this.loadUser();
    } catch (error) {
      await this.alertService.open({
        title: 'Error',
        message: 'No se pudo cargar la información del usuario.',
        type: 'error'
      });
      console.error(error);
      this.router.navigate(['/administracion/gestion-usuarios']);
    }
  }

  async loadUser() {
    const user = await this.firestoreService.getDocumentById<Usuario>('usuarios', this.userId);
    if (user) {
      this.currentUser.set(user);

      // Patch form values
      this.userForm.patchValue({
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.documento,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol,
        servicioId: user.servicioId || '',
        diasAtencion: user.diasAtencion || []
      });

      // If user is Pediatra, load services
      if (user.rol === 'Pediatra') {
        this.loadServicios();
      }
    } else {
      throw new Error('User not found');
    }
    this.loading.set(false);
  }

  loadServicios() {
    this.firestoreService.getCollection<Servicio>('servicios').subscribe(servicios => {
      // Filtrar solo servicios activos si es necesario
      this.servicios.set(servicios.filter(s => s.activo));
    });
  }

  getServiciosPorCategoria(categoria: string): Servicio[] {
    return this.servicios().filter(s => s.categoria === categoria);
  }

  onDiaChange(dia: string, event: any) {
    const diasControl = this.userForm.get('diasAtencion');
    if (event.target.checked) {
      diasControl?.setValue([...(diasControl.value || []), dia]);
    } else {
      diasControl?.setValue((diasControl.value || []).filter((d: string) => d !== dia));
    }
  }

  isDiaSelected(dia: string): boolean {
    const dias = this.userForm.get('diasAtencion')?.value || [];
    return dias.includes(dia);
  }

  async onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const formValue = this.userForm.getRawValue();

      const updateData: Partial<Usuario> = {
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        documento: formValue.dni,
        telefono: formValue.telefono,
        rol: formValue.rol,
        updatedAt: new Date()
      };

      if (updateData.rol === 'Pediatra') {
        updateData.servicioId = formValue.servicioId;
        updateData.diasAtencion = formValue.diasAtencion;
      } else {
        updateData.servicioId = '';
        updateData.diasAtencion = [];
      }

      await this.firestoreService.updateDocument('usuarios', this.userId, updateData);

      await this.alertService.open({
        title: 'Éxito',
        message: 'Usuario actualizado correctamente.',
        type: 'success'
      });

      this.router.navigate(['/administracion/gestion-usuarios']);
    } catch (error) {
      console.error('Error updating user:', error);
      this.saving.set(false);

      await this.alertService.open({
        title: 'Error',
        message: 'Hubo un problema al actualizar el usuario.',
        type: 'error'
      });
    } finally {
      this.saving.set(false);
    }
  }
}

