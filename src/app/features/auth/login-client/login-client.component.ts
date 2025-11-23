import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-login-client',
  imports: [CommonModule, LottieComponent],
  templateUrl: './login-client.component.html',
  styleUrl: './login-client.component.css'
})
export class LoginClientComponent {
  private alert: AlertService = inject(AlertService);

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

  async borrarCurso() {
    const result = await this.alert.open({
      title: 'Eliminar curso',
      message: '¿Seguro que deseas eliminar este curso?',
      type: 'success'
    });

    if (result) {
      // ejecutar lógica
    }
  }

}
