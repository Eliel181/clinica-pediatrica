import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-user',
  imports: [CommonModule, LottieComponent, ReactiveFormsModule],
  templateUrl: './login-user.component.html',
  styleUrl: './login-user.component.css'
})
export class LoginUserComponent {
  private fb: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private alert: AlertService = inject(AlertService);
  private router: Router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  options: AnimationOptions = {
    path: '/assets/animations/medicine.json'
  };

  public passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  animationCreated(animationItem: AnimationItem): void {
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    try {
      await this.authService.login(this.loginForm.value);
      this.alert.open({
        title: 'Inicio de sesión exitoso',
        message: 'Bienvenido al sistema',
        type: 'success'
      });
      this.router.navigate(['/administracion/gestion-usuarios']);
    } catch (error: any) {
      this.alert.open({
        title: 'Error de inicio de sesión',
        message: error.message,
        type: 'error'
      });
    }
  }
}
