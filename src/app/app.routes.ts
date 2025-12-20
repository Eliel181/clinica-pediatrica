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
            },
            {
                path: 'perfil-cliente', loadComponent: () => import('./features/auth/profile-cliente/profile-cliente.component').then(m => m.ProfileClienteComponent)
            },
            {
                path: 'solicitar-turno', loadComponent: () => import('./features/turnos/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent)
            },
            {
                path: 'mis-turnos', loadComponent: () => import('./features/turnos/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent)
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
            },
            {
                path: 'gestion-usuarios/edit-user/:id', loadComponent: () => import('./features/users/edit-user/edit-user.component').then(m => m.EditUserComponent)
            },
            {
                path: 'gestion-clinica', loadComponent: () => import('./features/clinic/clinic-managment/clinic-managment.component').then(m => m.ClinicManagmentComponent)
            },
            {
                path: 'gestion-servicios', loadComponent: () => import('./features/servicios-personalizados/servicios-managment/servicios-managment.component').then(m => m.ServiciosManagmentComponent)
            },
            {
                path: 'perfil-usuario', loadComponent: () => import('./features/auth/profile-user/profile-user.component').then(m => m.ProfileUserComponent)
            },
            {
                path: 'gestion-turnos', loadComponent: () => import('./features/turnos/turnos-list/turnos-list.component').then(m => m.TurnosListComponent)
            },
            {
                path: 'mis-turnos', loadComponent: () => import('./features/turnos/mis-turnos-profesional/mis-turnos-profesional.component').then(m => m.MisTurnosProfesionalComponent)
            },
            {
                path: 'gestion-vacunas', loadComponent: () => import('./features/vacunas/vacuna-list/vacuna-list.component').then(m => m.VacunaListComponent)
            },
            {
                path: 'consulta-medica/:id', loadComponent: () => import('./features/consultas/consulta-medica/consulta-medica.component').then(m => m.ConsultaMedicaComponent)
            },
            {
                path: 'vacunas-aplicacion/:id', loadComponent: () => import('./features/vacunas/vacunas-aplicacion/vacunas-aplicacion.component').then(m => m.VacunasAplicacionComponent)
            },
            {
                path: 'historia-clinica/:id', loadComponent: () => import('./features/consultas/historia-clinica/historia-clinica.component').then(m => m.HistoriaClinicaComponent)
            },
            {
                path: 'gestion-pacientes', loadComponent: () => import('./features/pacientes/paciente-list/paciente-list.component').then(m => m.PacienteListComponent)
            },
            {
                path: 'gestion-tareas', loadComponent: () => import('./features/tareas/gestion-tareas/gestion-tareas.component').then(m => m.GestionTareasComponent)
            },
            {
                path: 'gestion-tareas/form-tarea', loadComponent: () => import('./features/tareas/edit-tarea/edit-tarea.component').then(m => m.EditTareaComponent)
            },
            {
                path: 'gestion-tareas/form-tarea/:id', loadComponent: () => import('./features/tareas/edit-tarea/edit-tarea.component').then(m => m.EditTareaComponent)
            },
            {
                path: 'mis-tareas', loadComponent: () => import('./features/tareas/mis-tareas/mis-tareas.component').then(m => m.MisTareasComponent)
            },
            {
                path: 'mis-tareas/:id', loadComponent: () => import('./features/tareas/detalle-tarea/detalle-tarea.component').then(m => m.DetalleTareaComponent)
            }
        ]
    }
];
