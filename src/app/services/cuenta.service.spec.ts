import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CuentaService } from './cuenta.service';
import { environment } from '../../environments/environment';

describe('CuentaService', () => {
  let service: CuentaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CuentaService]
    });
    service = TestBed.inject(CuentaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería cargar cuentas y actualizar el signal', () => {
    const mockCuentas = [{ id: 1, numeroCuenta: '10001', tipoCuenta: 'AHORROS', saldoInicial: 150.00, estado: true, clienteId: 1 }];
    
    service.loadAll().subscribe();
    
    const req = httpMock.expectOne(`${environment.apiUrl}/cuentas`);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: { content: mockCuentas, page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
      message: 'OK',
      status: 200,
      timestamp: new Date().toISOString()
    });
    
    expect(service.getCuentas()()).toEqual(mockCuentas);
  });

  it('debería enviar el query param busqueda cuando se provee', () => {
    service.loadAll(' 10001 ').subscribe();

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/cuentas` && r.params.get('busqueda') === '10001');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true }, message: 'OK', status: 200, timestamp: new Date().toISOString() });
  });

  it('debería eliminar cuenta sin romper si el backend responde 204', () => {
    service['cuentas'].set([{ id: 1, numeroCuenta: '10001', tipoCuenta: 'AHORROS', saldoInicial: 150.00, estado: true, clienteId: 1 }]);

    service.deleteCuenta(1).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/cuentas/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.getCuentas()().length).toBe(0);
  });

  it('debería actualizar el saldo localmente (SRP)', () => {
    service['cuentas'].set([{ id: 1, numeroCuenta: '10001', tipoCuenta: 'AHORROS', saldoInicial: 150.00, estado: true, clienteId: 1 }]);
    service.updateSaldoLocal(1, 500);
    expect(service.getCuentaById(1)?.saldoInicial).toBe(500);
  });

  it('debería retornar undefined si se intenta buscar una cuenta inexistente (Edge case)', () => {
    service['cuentas'].set([{ id: 1, numeroCuenta: '10001', tipoCuenta: 'AHORROS', saldoInicial: 150.00, estado: true, clienteId: 1 }]);
    
    const cuentaInexistente = service.getCuentaById(999);
    
    expect(cuentaInexistente).toBeUndefined();
  });
});
