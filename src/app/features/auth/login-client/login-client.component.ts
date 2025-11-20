import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-login-client',
  imports: [CommonModule, LottieComponent],
  templateUrl: './login-client.component.html',
  styleUrl: './login-client.component.css'
})
export class LoginClientComponent {
  options: AnimationOptions = {
    path: '/assets/animations/pediatria.json'
  };

  public passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  animationCreated(animationItem: AnimationItem): void {
    console.log(animationItem);
  }
}
