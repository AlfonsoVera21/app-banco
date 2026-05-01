import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { TransaccionFacade } from '../../services/transaccion.facade';
import { MovimientoService } from '../../services/movimiento.service';
import { CuentaService } from '../../services/cuenta.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './movimientos.html',
  styleUrl: './movimientos.css'
})
export class MovimientosComponent implements OnInit {
  private transaccionFacade = inject(TransaccionFacade);
  private movimientoService = inject(MovimientoService);
  private cuentaService = inject(CuentaService);
  private fb = inject(FormBuilder);

  movimientos = this.movimientoService.getMovimientos();
  cuentas = this.cuentaService.getCuentas();
  searchControl = new FormControl('');

  errorMsg = signal<string | null>(null);

  filteredMovimientos = computed(() => {
    return this.movimientos();
  });

  isModalOpen = signal(false);

  form: FormGroup = this.fb.group({
    cuentaId: ['', Validators.required],
    tipoMovimiento: ['DEPOSITO', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]]
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q) => this.movimientoService.loadAll(q ?? undefined).subscribe());
  }

  ngOnInit() {
    this.cuentaService.loadAll().subscribe();
    this.movimientoService.loadAll().subscribe();
    
    this.form.valueChanges.subscribe(() => {
    this.errorMsg.set(null);
  });
  }

  getCuentaNumero(id: number): string {
    return this.cuentas().find(c => c.id === id)?.numeroCuenta || 'Desconocido';
  }

  getSaldoDisponible(cuentaId: number): number {
    const cuenta = this.cuentas().find(c => c.id === cuentaId);
    if (!cuenta) return 0;
    
    const movs = this.movimientos().filter(m => m.cuentaId === cuentaId);
    if (movs.length === 0) return cuenta.saldoInicial;
    
    return movs[movs.length - 1].saldo;
  }

  openModal() {
    this.errorMsg.set(null);
    this.form.reset({ tipoMovimiento: 'DEPOSITO', valor: 0, cuentaId: '' });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = {
      ...this.form.value,
      cuentaId: Number(this.form.value.cuentaId),
      valor: Number(this.form.value.valor)
    };

    this.errorMsg.set(null);

    this.transaccionFacade.realizarMovimiento(val).subscribe({
      next: () => {
        this.closeModal();
        this.movimientoService.loadAll().subscribe();
        this.cuentaService.loadAll().subscribe();
      },
      error: (e: any) => {
        const mensaje =
          e?.error?.message ||
          e?.error?.error ||
          e?.message ||
          'Ocurrió un error al registrar el movimiento';

        this.errorMsg.set(mensaje);
      }
    });
  }
}
