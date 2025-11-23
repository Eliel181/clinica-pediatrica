import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-login-user',
  imports: [CommonModule, LottieComponent],
  templateUrl: './login-user.component.html',
  styleUrl: './login-user.component.css'
})
export class LoginUserComponent {

  private alert:AlertService = inject(AlertService);

  options: AnimationOptions = {
    path: '/assets/animations/medicine.json'
  };

  public passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  animationCreated(animationItem: AnimationItem): void {
  }

  async borrarCurso() {
    const result = await this.alert.open({
      title: 'Eliminar curso',
      message: '¿Seguro que deseas eliminar este curso?',
      type: 'warning'
    });

    if (result) {
      // ejecutar lógica
    }
  }
}
