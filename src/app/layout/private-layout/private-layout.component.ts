import { AfterViewChecked, Component, computed, inject, Signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Usuario } from '../../core/interfaces/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';

declare const HSStaticMethods: any;
@Component({
  selector: 'app-private-layout',
  imports: [RouterModule],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent implements AfterViewChecked {
  private authService: AuthService = inject(AuthService);

  currentUser: Signal<Usuario | null | undefined> = this.authService.currentUser;

  private currentUserObservable = toObservable(this.currentUser);

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const nameInitial = user.nombre ? user.nombre.charAt(0).toUpperCase() : '';
    const surnameInitial = user.apellido ? user.apellido.charAt(0).toUpperCase() : '';
    return `${nameInitial}${surnameInitial}`;
  });

  logOut(): void {
    // Podemos agregar una confirmacion con .then
    this.authService.logOut();
  }
  ngAfterViewChecked() {
    HSStaticMethods.autoInit();
  }

}
