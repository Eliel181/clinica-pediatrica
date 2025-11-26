import { Component } from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'app-home',
  imports: [LottieComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  options: AnimationOptions = {
    path: '/assets/animations/hero.json'
  };

  animationCreated(animationItem: AnimationItem): void {
    console.log(animationItem);
  }
}
