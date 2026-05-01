import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CuentaService } from '../../services/cuenta.service';
import { ClienteService } from '../../services/cliente.service';
import { ICuenta } from '../../models';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './cuentas.html',
  styleUrl: './cuentas.css'
})
export class CuentasComponent implements OnInit {
  private cuentaService = inject(CuentaService);
  private clienteService = inject(ClienteService);
  private fb = inject(FormBuilder);

  cuentas = this.cuentaService.getCuentas();
  clientes = this.clienteService.getClientes();
  searchControl = new FormControl('');

  filteredCuentas = computed(() => {
    return this.cuentas();
  });

  isModalOpen = signal(false);
  editingId = signal<number | null>(null);
  errorMsg = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    numeroCuenta: ['', Validators.required],
    tipoCuenta: ['AHORROS', Validators.required],
    saldoInicial: [0, [Validators.required, Validators.min(0)]],
    estado: [true, Validators.required],
    clienteId: [null, Validators.required]
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => this.cuentaService.loadAll(q ?? undefined).subscribe());
  }

  ngOnInit() {
    this.clienteService.loadAll().subscribe();
    this.cuentaService.loadAll().subscribe();
  }

  getClienteNombre(id: number): string {
    return this.clientes().find(c => c.clienteId === id)?.nombre || 'Desconocido';
  }

  openModal() {
    this.errorMsg.set(null);
    this.form.reset({ tipoCuenta: 'AHORROS', saldoInicial: 0, estado: true, clienteId: null });
    this.editingId.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  edit(cuenta: ICuenta) {
    this.errorMsg.set(null);
    this.editingId.set(cuenta.id || null);
    this.form.patchValue(cuenta);
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
      this.cuentaService.updateCuenta({ ...val, id: this.editingId()! }).subscribe({
        next: () => this.closeModal(),
        error: (e) => this.errorMsg.set(e?.error?.message || e?.error?.error || e?.message || 'Ocurrió un error al actualizar la cuenta')
      });
    } else {
      this.cuentaService.addCuenta(val).subscribe({
        next: () => this.closeModal(),
        error: (e) => this.errorMsg.set(e?.error?.message || e?.error?.error || e?.message || 'Ocurrió un error al crear la cuenta')
      });
    }
  }

  delete(id?: number) {
    if (id && confirm('¿Está seguro de eliminar?')) {
      this.cuentaService.deleteCuenta(id).subscribe();
    }
  }
}
