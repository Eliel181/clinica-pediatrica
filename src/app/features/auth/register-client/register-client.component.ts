import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-client',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-client.component.html',
  styleUrl: './register-client.component.css'
})
export class RegisterClientComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private clienteService: ClienteService = inject(ClienteService);
  private router: Router = inject(Router);
  registerForm: FormGroup;
  isLoading = false;

  constructor() {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      documento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  public showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  hasError(field: string, errorType: string) {
    const control = this.registerForm.get(field);
    return control?.hasError(errorType) && control?.touched;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.clienteService.register(this.registerForm.value).then(() => {
      this.isLoading = false;
      console.log(this.registerForm.value)
    }).catch((error) => {
      console.error('Error al registrar el cliente:', error);
      this.isLoading = false;
    });
  }

  get nombre() { return this.registerForm.get('nombre'); }
  get apellido() { return this.registerForm.get('apellido'); }
  get documento() { return this.registerForm.get('documento'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
}
