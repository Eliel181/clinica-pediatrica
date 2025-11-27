import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layout/private-layout/private-layout.component';

export const routes: Routes = [
    { path: '', redirectTo: '', pathMatch: 'full' },
    // Layout público
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            {
                path: 'portal-interno', loadComponent: () => import('./features/auth/login-user/login-user.component').then(m => m.LoginUserComponent)
            },
            {
                path: 'portal-cliente', loadComponent: () => import('./features/auth/login-client/login-client.component').then(m => m.LoginClientComponent)
            },
            {
                path: 'registro-cliente', loadComponent: () => import('./features/auth/register-client/register-client.component').then(m => m.RegisterClientComponent)
            },
            {
                path: 'verificar-email', loadComponent: () => import('./features/auth/verificar-email/verificar-email.component').then(m => m.VerificarEmailComponent)
            },
            {
                path: 'reset-password', loadComponent: () => import('./features/auth/reset-passsword/reset-passsword.component').then(m => m.ResetPassswordComponent)
            },
            {
                path: 'inicio', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
            }
        ]
    },
    {
        path: 'administracion',
        component: PrivateLayoutComponent,
        children: [
            {
                path: 'gestion-usuarios', loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
            },
            {
                path: 'gestion-usuarios/form-user/:id', loadComponent: () => import('./features/users/user-managment/user-managment.component').then(m => m.UserManagmentComponent)
            },
            {
                path: 'gestion-usuarios/form-user', loadComponent: () => import('./features/users/user-managment/user-managment.component').then(m => m.UserManagmentComponent)
            }
        ]
    }
];
