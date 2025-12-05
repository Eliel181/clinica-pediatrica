import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-spinner-overlay',
  imports: [CommonModule, LottieComponent],
  templateUrl: './spinner-overlay.component.html',
  styleUrl: './spinner-overlay.component.css'
})
export class SpinnerOverlayComponent {

  options: AnimationOptions = {
    path: '/assets/animations/spinner.json'
  };

  animationCreated(animationItem: AnimationItem): void {
  }
}
