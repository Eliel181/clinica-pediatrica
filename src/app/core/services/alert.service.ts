import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  show = signal(false);
  title = signal('');
  message = signal('');
  type = signal<'success' | 'error' | 'warning' | 'info'>('info');

  private resolveFn!: (value: boolean) => void;

  open(options: { title: string, message: string, type?: any }): Promise<boolean> {
    this.title.set(options.title);
    this.message.set(options.message);
    this.type.set(options.type ?? 'info');

    this.show.set(true);

    return new Promise<boolean>(resolve => this.resolveFn = resolve);
  }

  confirm() {
    this.show.set(false);
    this.resolveFn(true);
  }

  cancel() {
    this.show.set(false);
    this.resolveFn(false);
  }
}
