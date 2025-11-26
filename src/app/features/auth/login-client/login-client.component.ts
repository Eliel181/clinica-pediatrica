import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { AlertService } from '../../../core/services/alert.service';
import { RouterLink, RouterModule } from "@angular/router";

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-client',
  imports: [CommonModule, RouterModule, LottieComponent, RouterLink, ReactiveFormsModule],
  templateUrl: './login-client.component.html',
  styleUrl: './login-client.component.css'
})
export class LoginClientComponent {
  private alert: AlertService = inject(AlertService);
  private fb: FormBuilder = inject(FormBuilder);
  private clienteService: ClienteService = inject(ClienteService);
  private router: Router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;

  constructor() {
    this.loginForm = this.fb.group({
      documento: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  options: AnimationOptions = {
    path: '/assets/animations/pediatria.json'
  };

  animationCreated(animationItem: AnimationItem): void {
    console.log(animationItem);
  }

  public passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { documento, password } = this.loginForm.value;

    try {
      await this.clienteService.loginConDni(documento, password);
      this.router.navigate(['/']); // Adjust route as needed
      this.alert.open({
        title: 'Inicio de sesión exitoso',
        message: 'Bienvenido al portal de clientes',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Login error:', error);
      this.alert.open({
        title: 'Error de inicio de sesión',
        message: error.message || 'Credenciales inválidas',
        type: 'error'
      });
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    // Implement Google login logic here if needed, likely via AuthService or ClienteService
    this.alert.open({
      title: 'Próximamente',
      message: 'El inicio de sesión con Google para clientes estará disponible pronto.',
      type: 'info'
    });
  }
}
