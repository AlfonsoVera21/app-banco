import { TestBed } from '@angular/core/testing';
import { TransaccionFacade } from './transaccion.facade';
import { MovimientoService } from './movimiento.service';
import { CuentaService } from './cuenta.service';
import { of, throwError } from 'rxjs';

describe('TransaccionFacade', () => {
  let facade: TransaccionFacade;
  let movimientoServiceSpy: { addMovimiento: jest.Mock };
  let cuentaServiceSpy: { getCuentaById: jest.Mock, updateSaldoLocal: jest.Mock };

  beforeEach(() => {
    const movSpy = { addMovimiento: jest.fn() };
    const ctaSpy = { getCuentaById: jest.fn(), updateSaldoLocal: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        TransaccionFacade,
        { provide: MovimientoService, useValue: movSpy },
        { provide: CuentaService, useValue: ctaSpy }
      ]
    });
    facade = TestBed.inject(TransaccionFacade);
    movimientoServiceSpy = TestBed.inject(MovimientoService) as unknown as { addMovimiento: jest.Mock };
    cuentaServiceSpy = TestBed.inject(CuentaService) as unknown as { getCuentaById: jest.Mock, updateSaldoLocal: jest.Mock };
  });

  it('debería coordinar el movimiento y actualizar el saldo local (Orquestador)', (done) => {
    const movimientoMock = { cuentaId: 1, tipoMovimiento: 'DEPOSITO' as const, valor: 50 };
    const responseMock = { ...movimientoMock, id: 99, saldo: 150, fecha: new Date() };
    movimientoServiceSpy.addMovimiento.mockReturnValue(of(responseMock));

    facade.realizarMovimiento(movimientoMock).subscribe(() => {
      expect(movimientoServiceSpy.addMovimiento).toHaveBeenCalledWith(movimientoMock);
      expect(cuentaServiceSpy.updateSaldoLocal).toHaveBeenCalledWith(1, 150);
      done();
    });
  });

  it('NO debería actualizar el saldo local si el backend falla al guardar el movimiento (Error 500, Interacción)', (done) => {
    const movimientoMock = { cuentaId: 1, tipoMovimiento: 'DEPOSITO' as const, valor: 50 };
    movimientoServiceSpy.addMovimiento.mockReturnValue(throwError(() => ({ status: 500, message: 'Internal Server Error' })));

    facade.realizarMovimiento(movimientoMock).subscribe({
      next: () => fail('Debería haber fallado'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(cuentaServiceSpy.updateSaldoLocal).not.toHaveBeenCalled();
        done();
      }
    });
  });
});

describe('TransaccionFacade (Isolated sin TestBed - ULTRA RÁPIDO)', () => {
  it('debería instanciar y ejecutar lógica sin levantar el entorno de Angular', () => {
    const movimientoServiceMock = { addMovimiento: jest.fn() } as any;
    const cuentaServiceMock = { getCuentaById: jest.fn(), updateSaldoLocal: jest.fn() } as any;
    const facade = new TransaccionFacade(movimientoServiceMock, cuentaServiceMock);
    
    movimientoServiceMock.addMovimiento.mockReturnValue(throwError(() => new Error('Saldo insuficiente')));

    facade.realizarMovimiento({ cuentaId: 1, tipoMovimiento: 'RETIRO', valor: 50 }).subscribe({
      next: () => fail('Debería haber fallado'),
      error: (err: any) => expect(err.message).toBe('Saldo insuficiente')
    });
  });
});
