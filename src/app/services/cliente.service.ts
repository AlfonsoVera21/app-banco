import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { ICliente, ApiResponse, Page } from '../models';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;

  private clientes = signal<ICliente[]>([]);

  getClientes() { 
    return this.clientes; 
  }

  loadAll(busqueda?: string) {
    let params = new HttpParams();
    const q = busqueda?.trim();
    if (q) params = params.set('busqueda', q);

    return this.http.get<ApiResponse<ICliente[] | Page<ICliente>>>(this.apiUrl, { params }).pipe(
      map(res => (Array.isArray(res.data) ? res.data : res.data?.content) ?? []),
      tap(data => this.clientes.set(data))
    );
  }

  addCliente(cliente: ICliente) {
    return this.http.post<ApiResponse<ICliente>>(this.apiUrl, cliente).pipe(
      map(res => res.data),
      tap(newCliente => this.clientes.update(cls => [...cls, newCliente]))
    );
  }

  updateCliente(cliente: ICliente) {
    return this.http.put<ApiResponse<ICliente>>(`${this.apiUrl}/${cliente.clienteId}`, cliente).pipe(
      map(res => res.data),
      tap(updatedCliente => this.clientes.update(cls => cls.map(c => c.clienteId === updatedCliente.clienteId ? updatedCliente : c)))
    );
  }

  deleteCliente(clienteId: number) {
    return this.http.delete<void>(`${this.apiUrl}/${clienteId}`).pipe(
      tap(() => this.clientes.update(cls => cls.filter(c => c.clienteId !== clienteId)))
    );
  }
}
