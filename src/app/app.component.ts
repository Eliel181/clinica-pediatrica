import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Router, Event, NavigationEnd } from '@angular/router';
import { CustomAlertComponent } from './shared/custom-alert/custom-alert.component';
import { AlertService } from './services/alert.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CustomAlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  private router: Router = inject(Router);
  public alert: AlertService = inject(AlertService);
  title = 'clinica-pediatrica';


  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => window.HSStaticMethods.autoInit(), 100);
      }
    });
  }
}
