import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirestoreService } from '../../../core/services/firestore.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-user-managment',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-managment.component.html',
  styleUrl: './user-managment.component.css'
})
export class UserManagmentComponent implements OnInit {

  private firestoreService: FirestoreService = inject(FirestoreService);
  private alertService: AlertService = inject(AlertService);
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
      this.alertService.open({
        title: 'Exito',
        message: 'Usuario registrado con exito',
        type: 'success',
      })
      this.router.navigate(['/administracion/gestion-usuarios']);
      //this.authService.sendEmailVerification();
    } catch (error: any) {
      this.alertService.open({
        title: 'Error',
        message: 'Error al registrar usuario',
        type: 'error',
      })
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
