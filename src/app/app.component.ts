import { Component, inject, OnInit, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Router, Event, NavigationEnd } from '@angular/router';
import { CustomAlertComponent } from './shared/custom-alert/custom-alert.component';
import { AlertService } from './core/services/alert.service';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { SpinnerOverlayComponent } from './shared/spinner-overlay/spinner-overlay.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CustomAlertComponent, SpinnerOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private router: Router = inject(Router);
  private authService: AuthService = inject(AuthService);
  public alert: AlertService = inject(AlertService);
  title = 'clinica-pediatrica';

  isAuthLoading: Signal<boolean> = this.authService.isAuthStatusLoaded;

  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => window.HSStaticMethods.autoInit(), 100);
      }
    });
  }
}
