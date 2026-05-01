import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { IMovimiento, ApiResponse, Page } from '../models';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/movimientos`;

  private movimientos = signal<IMovimiento[]>([]);

  getMovimientos() { return this.movimientos; }

  loadAll(busqueda?: string) {
    let params = new HttpParams();
    const q = busqueda?.trim();
    if (q) params = params.set('busqueda', q);

    return this.http.get<ApiResponse<IMovimiento[] | Page<IMovimiento>>>(this.apiUrl, { params }).pipe(
      map(res => (Array.isArray(res.data) ? res.data : res.data?.content) ?? []),
      tap(data => this.movimientos.set(data))
    );
  }

  addMovimiento(payload: any) {
    return this.http.post<ApiResponse<IMovimiento>>(this.apiUrl, payload).pipe(
      map(res => res.data),
      tap(newMov => this.movimientos.update(mvs => [...mvs, newMov]))
    );
  }
}
