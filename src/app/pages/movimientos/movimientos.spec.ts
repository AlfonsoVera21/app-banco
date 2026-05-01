import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { MovimientosComponent } from './movimientos';
import { MovimientoService } from '../../services/movimiento.service';
import { CuentaService } from '../../services/cuenta.service';
import { TransaccionFacade } from '../../services/transaccion.facade';

describe('MovimientosComponent', () => {
  let component: MovimientosComponent;
  let fixture: ComponentFixture<MovimientosComponent>;
  let movimientoServiceMock: { getMovimientos: jest.Mock; loadAll: jest.Mock };
  let cuentaServiceMock: { getCuentas: jest.Mock; loadAll: jest.Mock };
  let transaccionFacadeMock: { realizarMovimiento: jest.Mock };

  beforeEach(async () => {
    movimientoServiceMock = {
      getMovimientos: jest.fn().mockReturnValue(signal([])),
      loadAll: jest.fn().mockReturnValue(of([]))
    };
    cuentaServiceMock = {
      getCuentas: jest.fn().mockReturnValue(signal([])),
      loadAll: jest.fn().mockReturnValue(of([]))
    };
    transaccionFacadeMock = {
      realizarMovimiento: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MovimientosComponent],
      providers: [
        { provide: MovimientoService, useValue: movimientoServiceMock },
        { provide: CuentaService, useValue: cuentaServiceMock },
        { provide: TransaccionFacade, useValue: transaccionFacadeMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MovimientosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería exponer movimientos sin filtrar en filteredMovimientos', () => {
    component.movimientos = signal([
      { id: 10, cuentaId: 1, tipoMovimiento: 'DEPOSITO', valor: 50, saldo: 50, fecha: new Date() }
    ]) as any;

    component.searchControl.setValue('cualquier cosa');
    const resultado = component.filteredMovimientos();
    expect(resultado.length).toBe(1);
  });

  it('debería hacer búsqueda en backend con debounce', fakeAsync(() => {
    component.searchControl.setValue('10');
    component.searchControl.setValue('10001');
    tick(300);
    expect(movimientoServiceMock.loadAll).toHaveBeenCalledWith('10001');
  }));

  it('debería actualizar el errorMsg signal si el facade falla', () => {
    component.form.setValue({ cuentaId: '1', tipoMovimiento: 'RETIRO', valor: 50 });
    
    transaccionFacadeMock.realizarMovimiento.mockReturnValue(throwError(() => new Error('Saldo insuficiente')));

    component.save();
    expect(component.errorMsg()).toBe('Saldo insuficiente');
  });
});
