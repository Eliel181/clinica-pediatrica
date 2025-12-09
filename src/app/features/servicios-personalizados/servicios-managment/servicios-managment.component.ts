import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { Servicio } from '../../../core/interfaces/servicio.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirestoreService } from '../../../core/services/firestore.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-servicios-managment',
  standalone: true, // Ensure standalone is true
  imports: [CommonModule, ReactiveFormsModule], // Add CommonModule to imports
  templateUrl: './servicios-managment.component.html',
  styleUrl: './servicios-managment.component.css'
})
export class ServiciosManagmentComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private firestoreService: FirestoreService = inject(FirestoreService);
  private alertService: AlertService = inject(AlertService);

  servicios: WritableSignal<Servicio[]> = signal([]);
  servicioForm: FormGroup;
  isEditMode: boolean = false;
  isModalVisible: boolean = false;

  categorias: string[] = [
    'Consulta',
    'Control',
    'Vacuna',
    'Estudio',
    'Laboratorio',
    'Especialidad',
    'Administrativo',
    'Otro'
  ];

  constructor() {
    this.servicioForm = this.fb.group({
      id: [null], // Add ID field (optional/nullable)
      nombre: ['', Validators.required],
      categoria: ['', Validators.required],
      descripcion: ['', Validators.required],
      duracionMinutos: ['', Validators.required],
      precio: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.firestoreService.getCollection<Servicio>('servicios').subscribe((servicios) => {
      this.servicios.set(servicios);
    });
  }

  openModalForCreate(date: string) {
    this.isEditMode = false;
    this.servicioForm.reset({
      id: null,
      nombre: '',
      categoria: '',
      descripcion: '',
      duracionMinutos: '',
      precio: '',
    });
    this.isModalVisible = true;
  }

  //funcion abre el modal con los datos de la visita a editar
  openModalForEdit(id: string) {
    if (!id) {
      return;
    }

    this.firestoreService.getDocumentById<Servicio>('servicios', id).then((servicio) => {
      if (servicio) {
        this.servicioForm.patchValue(servicio);
      }
    });

    this.isEditMode = true;

    this.isModalVisible = true;
  }

  onSubmit(): void {
    if (this.servicioForm.invalid) {
      this.servicioForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode) {
      this.updateServicio();
    } else {
      this.addServicio();
    }
  }

  closeModal() {
    this.isModalVisible = false;
    this.servicioForm.reset();
  }

  updateServicio(): void {
    const { id, ...data } = this.servicioForm.value;
    if (!id) return; // Guard clause if ID is missing

    this.firestoreService.updateDocument<Servicio>('servicios', id, data as Servicio);
    this.closeModal();
    this.alertService.open({
      title: 'Servicio actualizado',
      message: 'El servicio se actualizó correctamente',
      type: 'success'
    });
  }

  addServicio(): void {
    const { id, ...data } = this.servicioForm.value;
    data.createdAt = new Date();
    data.activo = true;
    this.firestoreService.addDocument<Servicio>('servicios', data as Servicio);
    this.closeModal();
    this.alertService.open({
      title: 'Servicio agregado',
      message: 'El servicio se agregó correctamente',
      type: 'success'
    });
  }

}
