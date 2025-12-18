import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PacienteService } from '../../../core/services/paciente.service';
import { TurnoService } from '../../../core/services/turno.service';
import { Paciente } from '../../../core/interfaces/paciente.model';
import { combineLatest, map, switchMap, of } from 'rxjs';

interface DashboardStats {
  total: number;
  masculino: number;
  femenino: number;
  otro: number;
}

@Component({
  selector: 'app-paciente-list',
  imports: [CommonModule],
  templateUrl: './paciente-list.component.html',
  styleUrl: './paciente-list.component.css'
})
export class PacienteListComponent implements OnInit {
  private authService = inject(AuthService);
  private pacienteService = inject(PacienteService);
  private turnoService = inject(TurnoService);

  pacientes: Paciente[] = [];
  stats: DashboardStats = {
    total: 0,
    masculino: 0,
    femenino: 0,
    otro: 0
  };
  isLoading = true;
  currentUserRole: string = '';

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();

    if (!currentUser) {
      this.isLoading = false;
      return;
    }

    this.currentUserRole = currentUser.rol || '';

    if (currentUser.rol === 'Admin') {
      // Admin: Load all patients
      this.pacienteService.getAllPacientes().subscribe({
        next: (pacientes) => {
          this.pacientes = pacientes;
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading patients:', error);
          this.isLoading = false;
        }
      });
    } else if (currentUser.rol === 'Pediatra') {
      // Pediatra: Load only patients from their turnos
      this.turnoService.getTurnosByProfesionalId(currentUser.uid)
        .pipe(
          switchMap(turnos => {
            // Extract unique patient IDs
            const uniquePacienteIds = [...new Set(turnos.map(t => t.pacienteId))];

            if (uniquePacienteIds.length === 0) {
              return of([]);
            }

            // Load all patients and filter by IDs
            return this.pacienteService.getAllPacientes().pipe(
              map(allPacientes =>
                allPacientes.filter(p => uniquePacienteIds.includes(p.id))
              )
            );
          })
        )
        .subscribe({
          next: (pacientes) => {
            this.pacientes = pacientes;
            this.calculateStats();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading patients for pediatra:', error);
            this.isLoading = false;
          }
        });
    } else {
      // Other roles: no access
      this.isLoading = false;
    }
  }

  calculateStats(): void {
    this.stats = {
      total: this.pacientes.length,
      masculino: this.pacientes.filter(p => p.sexo === 'Masculino').length,
      femenino: this.pacientes.filter(p => p.sexo === 'Femenino').length,
      otro: this.pacientes.filter(p => p.sexo === 'Otro').length
    };
  }

  calculateAge(fechaNacimiento: string): number {
    const birthDate = new Date(fechaNacimiento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
