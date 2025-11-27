import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirestoreService } from '../../../core/services/firestore.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/interfaces/usuario.model';

@Component({
  selector: 'app-user-managment',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-managment.component.html',
  styleUrl: './user-managment.component.css'
})
export class UserManagmentComponent implements OnInit {

  private firestoreService: FirestoreService = inject(FirestoreService);
  public authService: AuthService = inject(AuthService);
  private fb: FormBuilder = inject(FormBuilder);
  route = inject(ActivatedRoute);
  private router: Router = inject(Router);
  userForm: FormGroup;

  usuarioData: Usuario | null = null;
  isSubmitting = signal<boolean>(false);

  imagenBase64Preview: WritableSignal<string | null> = signal(null);

  constructor() {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: ['', [Validators.required]],
      documento: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      domicilio: ['', [Validators.required]],
      turno: [''],
      horasTrabajo: [''],
      rol: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Componente solo para creación
  }

  async registrarUsuario() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      // Registro de nuevo usuario
      const formValue = this.userForm.value;
      await this.authService.register({
        ...formValue,
        fechaAlta: new Date()
      });
      alert('Usuario registrado con éxito');
      this.router.navigate(['/administracion/gestion-usuarios']);

    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      alert('Error al guardar usuario: ' + error.message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
