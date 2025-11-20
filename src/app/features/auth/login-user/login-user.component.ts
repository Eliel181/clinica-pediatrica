import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-login-user',
  imports: [CommonModule, LottieComponent],
  templateUrl: './login-user.component.html',
  styleUrl: './login-user.component.css'
})
export class LoginUserComponent {
  options: AnimationOptions = {
    path: '/assets/animations/medicine.json'
  };

  public passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  animationCreated(animationItem: AnimationItem): void {
  }
}
