import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

@Component({
  selector: 'app-custom-alert',
  imports: [CommonModule, LottieComponent],
  templateUrl: './custom-alert.component.html',
  styleUrl: './custom-alert.component.css'
})
export class CustomAlertComponent implements OnChanges {
  @Input() title = '';
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() show = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  options: AnimationOptions = {
    path: '/assets/animations/medicine.json', // Default
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type']) {
      this.updateAnimation();
    }
  }

  private updateAnimation() {
    let path = '';
    switch (this.type) {
      case 'success':
        path = '/assets/animations/success.json';
        break;
      case 'error':
        path = '/assets/animations/error.json';
        break;
      case 'warning':
        path = '/assets/animations/question.json';
        break;
      case 'info':
        path = '/assets/animations/question.json';
        break;
      default:
        path = '/assets/animations/medicine.json';
    }
    this.options = {
      ...this.options,
      path,
    };
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
