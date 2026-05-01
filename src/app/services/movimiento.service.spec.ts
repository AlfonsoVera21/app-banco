import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MovimientoService } from './movimiento.service';
import { environment } from '../../environments/environment';

describe('MovimientoService', () => {
  let service: MovimientoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MovimientoService]
    });
    service = TestBed.inject(MovimientoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería hacer POST a /movimientos', () => {
    const nuevoMov: any = { cuentaId: '1', tipo: 'Deposito', valor: 100, saldo: 250 };
    const mockRes = { ...nuevoMov, id: '99', fecha: new Date() };

    service.addMovimiento(nuevoMov).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/movimientos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevoMov);
    req.flush({ data: mockRes, message: 'OK', status: 200, timestamp: new Date().toISOString() });

    expect(service.getMovimientos()().length).toBe(1);
    expect(service.getMovimientos()()[0].id).toBe('99');
  });

  it('debería manejar error 400 (Bad Request) si se envía un valor negativo', () => {
    const nuevoMov: any = { cuentaId: '1', tipo: 'Retiro', valor: -50 };
    
    service.addMovimiento(nuevoMov).subscribe({
      next: () => fail('No debería pasar el request'),
      error: (err) => expect(err.status).toBe(400)
    });
    
    const req = httpMock.expectOne(`${environment.apiUrl}/movimientos`);
    req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

    expect(service.getMovimientos()().length).toBe(0);
  });

  it('debería manejar rechazo del backend por saldo insuficiente', () => {
    const movInvalido: any = { cuentaId: '1', tipo: 'Retiro', valor: 500000 };
    
    service.addMovimiento(movInvalido).subscribe({
      next: () => fail('No debería pasar el request'),
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.error).toBe('Saldo insuficiente');
      }
    });
    
    const req = httpMock.expectOne(`${environment.apiUrl}/movimientos`);
    req.flush('Saldo insuficiente', { status: 400, statusText: 'Bad Request' });

    expect(service.getMovimientos()().length).toBe(0);
  });

  it('debería cargar movimientos y mapear data.content (paginado)', () => {
    const mockMovs: any[] = [{ id: 1, cuentaId: 1, tipoMovimiento: 'DEPOSITO', valor: 10, saldo: 10, fecha: new Date() }];

    service.loadAll().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/movimientos`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { content: mockMovs, page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true }, message: 'OK', status: 200, timestamp: new Date().toISOString() });

    expect(service.getMovimientos()()).toEqual(mockMovs);
  });

  it('debería enviar el query param busqueda cuando se provee', () => {
    service.loadAll(' 10001 ').subscribe();

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/movimientos` && r.params.get('busqueda') === '10001');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true }, message: 'OK', status: 200, timestamp: new Date().toISOString() });
  });
});
