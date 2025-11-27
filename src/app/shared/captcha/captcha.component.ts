import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-captcha',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './captcha.component.html',
    styleUrl: './captcha.component.css'
})
export class CaptchaComponent {
    @Output() captchaStatus = new EventEmitter<boolean>();

    captchaText: string = '';
    userInput: string = '';
    isValid: boolean = false;

    constructor() {
        this.generateCaptcha();
    }

    generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.captchaText = result;
        this.userInput = '';
        this.validateCaptcha();
    }

    validateCaptcha() {
        this.isValid = this.userInput === this.captchaText;
        this.captchaStatus.emit(this.isValid);
    }
}
