import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
  // Layout público
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
        {
            path: 'login', loadComponent: () => import('./features/auth/login-user/login-user.component').then(m => m.LoginUserComponent)
        },
        {
            path: 'register', loadComponent: () => import('./features/auth/register-user/register-user.component').then(m => m.RegisterUserComponent)
        }
        //   {
        //     path: 'verificar-email', loadComponent: () => import('./features/auth/verificar-email/verificar-email.component').then(m => m.VerificarEmailComponent)
        //   },
        //   {
        //     path: 'reset-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
        //   },
        ]
    },
];
