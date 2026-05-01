import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClienteService } from './cliente.service';
import { environment } from '../../environments/environment';

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClienteService]
    });
    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('debería cargar clientes y actualizar el signal', () => {
    const mockClientes = [{ clienteId: 1, nombre: 'Juan Perez', genero: 'Masculino', edad: 30, identificacion: '1234567890', direccion: 'Calle Falsa', telefono: '123', contrasena: 'abc', estado: true }];
    
    service.loadAll().subscribe();
    
    const req = httpMock.expectOne(`${environment.apiUrl}/clientes`);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: { content: mockClientes, page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
      message: 'OK',
      status: 200,
      timestamp: new Date().toISOString()
    });
    
    expect(service.getClientes()()).toEqual(mockClientes);
  });

  it('debería agregar cliente y actualizar estado local', () => {
    const newCliente = { clienteId: 2, nombre: 'Ana', genero: 'Femenino', edad: 25, identificacion: '098', direccion: 'Av. Siempre', telefono: '098', contrasena: '123', estado: true };
    
    service.addCliente({ nombre: 'Ana', genero: 'Femenino', edad: 25, identificacion: '098', direccion: 'Av. Siempre', telefono: '098', contrasena: '123', estado: true }).subscribe();
    
    const req = httpMock.expectOne(`${environment.apiUrl}/clientes`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: newCliente, message: 'OK', status: 200, timestamp: new Date().toISOString() });
    
    expect(service.getClientes()()).toContainEqual(expect.objectContaining({ clienteId: 2 }));
  });

  it('debería enviar el query param busqueda cuando se provee', () => {
    service.loadAll(' jose ').subscribe();

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/clientes` && r.params.get('busqueda') === 'jose');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true }, message: 'OK', status: 200, timestamp: new Date().toISOString() });
  });

  it('debería eliminar cliente sin romper si el backend responde 204', () => {
    service['clientes'].set([{ clienteId: 1, nombre: 'Juan', genero: 'Masculino', edad: 30, identificacion: '1', direccion: 'x', telefono: 'y', contrasena: 'z', estado: true }]);

    service.deleteCliente(1).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/clientes/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.getClientes()().length).toBe(0);
  });

  it('debería manejar error 500 al fallar el backend de forma segura', () => {
    service.loadAll().subscribe({
      next: () => fail('No debería entrar en next'),
      error: (err) => expect(err.status).toBe(500)
    });
    
    const req = httpMock.expectOne(`${environment.apiUrl}/clientes`);
    expect(req.request.method).toBe('GET');
    req.flush('Error interno', { status: 500, statusText: 'Internal Server Error' });
    
    expect(service.getClientes()()).toEqual([]);
  });
});
