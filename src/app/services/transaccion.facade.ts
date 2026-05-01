import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MovimientoService } from './movimiento.service';
import { CuentaService } from './cuenta.service';
import { IMovimiento } from '../models';

@Injectable({ providedIn: 'root' })
export class TransaccionFacade {
  constructor(
    private movimientoService: MovimientoService,
    private cuentaService: CuentaService
  ) {}

  realizarMovimiento(
    mov: Omit<IMovimiento, 'id' | 'fecha' | 'saldo'>
  ): Observable<IMovimiento> {
    const payload = {
      tipoMovimiento: mov.tipoMovimiento,
      valor: mov.valor,
      cuentaId: mov.cuentaId
    };

    return this.movimientoService.addMovimiento(payload).pipe(
      tap(response => {
        this.cuentaService.updateSaldoLocal(response.cuentaId, response.saldo);
      })
    );
  }
}