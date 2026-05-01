import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { CuentasComponent } from './cuentas';
import { CuentaService } from '../../services/cuenta.service';
import { ClienteService } from '../../services/cliente.service';

describe('CuentasComponent', () => {
  let component: CuentasComponent;
  let fixture: ComponentFixture<CuentasComponent>;
  let cuentaServiceMock: { getCuentas: jest.Mock; loadAll: jest.Mock; addCuenta: jest.Mock; updateCuenta: jest.Mock; deleteCuenta: jest.Mock };
  let clienteServiceMock: { getClientes: jest.Mock; loadAll: jest.Mock };

  beforeEach(async () => {
    cuentaServiceMock = {
      getCuentas: jest.fn().mockReturnValue(signal([])),
      loadAll: jest.fn().mockReturnValue(of([])),
      addCuenta: jest.fn().mockReturnValue(of({})),
      updateCuenta: jest.fn().mockReturnValue(of({})),
      deleteCuenta: jest.fn().mockReturnValue(of(void 0))
    };
    clienteServiceMock = {
      getClientes: jest.fn().mockReturnValue(signal([])),
      loadAll: jest.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [CuentasComponent],
      providers: [
        { provide: CuentaService, useValue: cuentaServiceMock },
        { provide: ClienteService, useValue: clienteServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CuentasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería llamar loadAll() de clientes y cuentas al iniciar', () => {
    component.ngOnInit();
    expect(clienteServiceMock.loadAll).toHaveBeenCalled();
    expect(cuentaServiceMock.loadAll).toHaveBeenCalled();
  });

  it('debería hacer búsqueda en backend con debounce', fakeAsync(() => {
    component.searchControl.setValue('10');
    component.searchControl.setValue('10001');
    tick(300);
    expect(cuentaServiceMock.loadAll).toHaveBeenCalledWith('10001');
  }));

  it('debería mostrar errorMsg si falla al actualizar cuenta', () => {
    cuentaServiceMock.updateCuenta.mockReturnValue(throwError(() => ({ error: { message: 'Cuenta inválida' } })));

    component.openModal();
    component.editingId.set(1);
    component.form.setValue({
      numeroCuenta: '10001',
      tipoCuenta: 'AHORROS',
      saldoInicial: 0,
      estado: true,
      clienteId: 1
    });

    component.save();
    expect(component.errorMsg()).toBe('Cuenta inválida');
  });
});
