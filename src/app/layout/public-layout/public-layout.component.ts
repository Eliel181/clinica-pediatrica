import { AfterViewChecked, Component, computed, inject, Signal } from '@angular/core';
import { RouterModule, RouterOutlet } from "@angular/router";
import { Cliente } from '../../core/interfaces/cliente.model';
import { ClienteService } from '../../core/services/cliente.service';
import { toObservable } from '@angular/core/rxjs-interop';
//import { environment } from '../../../environments/environment.development';

declare const HSStaticMethods: any;

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent implements AfterViewChecked {

  private clientService: ClienteService = inject(ClienteService);

  currentClient: Signal<Cliente | null | undefined> = this.clientService.currentClient;

  private currentClientObservable = toObservable(this.currentClient);

  clientInitials = computed(() => {
    const client = this.currentClient();
    if (!client) return '';
    const nameInitial = client.nombre ? client.nombre.charAt(0).toUpperCase() : '';
    const surnameInitial = client.apellido ? client.apellido.charAt(0).toUpperCase() : '';
    return `${nameInitial}${surnameInitial}`;
  });

  // const resend = new Resend(environment.resend.apiKey);

  // resend.emails.send({
  //   from: 'onboarding@resend.dev',
  //   to: 'baleroeliel@gmail.com',
  //   subject: 'Hello World',
  //   html: '<p>Congrats on sending your <strong>Primer Correo</strong>!</p>'
  // });

  logOut(): void {
    this.clientService.logOut();
  }

  ngAfterViewChecked() {
    HSStaticMethods.autoInit();
  }
}
