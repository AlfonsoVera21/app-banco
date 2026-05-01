import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { ICliente } from '../../models';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private fb = inject(FormBuilder);

  clientes = this.clienteService.getClientes();
  searchControl = new FormControl('');

  filteredClientes = computed(() => {
    return this.clientes();
  });

  isModalOpen = signal(false);
  editingId = signal<number | null>(null);
  errorMsg = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    genero: ['', Validators.required],
    edad: [18, [Validators.required, Validators.min(0)]],
    identificacion: ['', Validators.required],
    direccion: ['', Validators.required],
    telefono: ['', Validators.required],
    contrasena: ['', Validators.required],
    estado: [true, Validators.required]
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => this.clienteService.loadAll(q ?? undefined).subscribe());
  }

  ngOnInit() {
    this.clienteService.loadAll().subscribe();
  }

  openModal() {
    this.errorMsg.set(null);
    this.form.reset({ estado: true });
    this.editingId.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  edit(cliente: ICliente) {
    this.errorMsg.set(null);
    this.editingId.set(cliente.clienteId || null);
    this.form.patchValue(cliente);
    this.isModalOpen.set(true);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMsg.set(null);
    const val = this.form.value;
    if (this.editingId()) {
      this.clienteService.updateCliente({ ...val, clienteId: this.editingId()! }).subscribe({
        next: () => this.closeModal(),
        error: (e) => this.errorMsg.set(e?.error?.message || e?.error?.error || e?.message || 'Ocurrió un error al actualizar el cliente')
      });
    } else {
      this.clienteService.addCliente(val).subscribe({
        next: () => this.closeModal(),
        error: (e) => this.errorMsg.set(e?.error?.message || e?.error?.error || e?.message || 'Ocurrió un error al crear el cliente')
      });
    }
  }

  delete(clienteId?: number) {
    if (clienteId && confirm('¿Está seguro de eliminar?')) {
      this.clienteService.deleteCliente(clienteId).subscribe();
    }
  }
}
