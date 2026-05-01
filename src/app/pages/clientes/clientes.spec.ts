import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ClientesComponent } from './clientes';
import { ClienteService } from '../../services/cliente.service';

describe('ClientesComponent', () => {
  let component: ClientesComponent;
  let fixture: ComponentFixture<ClientesComponent>;
  let clienteServiceMock: {
    getClientes: jest.Mock;
    loadAll: jest.Mock;
    addCliente: jest.Mock;
    updateCliente: jest.Mock;
  };

  beforeEach(async () => {
    clienteServiceMock = {
      getClientes: jest.fn().mockReturnValue(signal([])),
      loadAll: jest.fn().mockReturnValue(of([])),
      addCliente: jest.fn().mockReturnValue(of({})),
      updateCliente: jest.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [{ provide: ClienteService, useValue: clienteServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería llamar loadAll() al iniciar', () => {
    component.ngOnInit();
    expect(clienteServiceMock.loadAll).toHaveBeenCalled();
  });

  it('debería hacer búsqueda en backend con debounce', fakeAsync(() => {
    component.searchControl.setValue('jo');
    component.searchControl.setValue('jose');

    tick(299);
    expect(clienteServiceMock.loadAll).not.toHaveBeenCalledWith('jose');

    tick(1);
    expect(clienteServiceMock.loadAll).toHaveBeenCalledWith('jose');
  }));

  it('debería mostrar errorMsg si falla al crear cliente', () => {
    clienteServiceMock.addCliente.mockReturnValue(throwError(() => ({ error: { message: 'Duplicado' } })));

    component.openModal();
    component.form.setValue({
      nombre: 'A',
      genero: 'Masculino',
      edad: 18,
      identificacion: '123',
      direccion: 'x',
      telefono: 'y',
      contrasena: 'z',
      estado: true
    });

    component.save();
    expect(component.errorMsg()).toBe('Duplicado');
  });
});
