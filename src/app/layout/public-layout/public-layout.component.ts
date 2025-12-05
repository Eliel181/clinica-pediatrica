import { AfterViewChecked, Component, inject, Signal } from '@angular/core';
import { RouterModule, RouterOutlet } from "@angular/router";
import { Cliente } from '../../core/interfaces/cliente.model';
import { ClienteService } from '../../core/services/cliente.service';
import { toObservable } from '@angular/core/rxjs-interop';

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

  logOut(): void {
    // Podemos agregar una confirmacion con .then
    this.clientService.logOut();
  }

  ngAfterViewChecked() {
    HSStaticMethods.autoInit();
  }
}
