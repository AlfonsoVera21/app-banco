import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { ICuenta, ApiResponse, Page } from '../models';
import { environment } from '../../environments/environment';
import { tap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cuentas`;

  private cuentas = signal<ICuenta[]>([]);

  getCuentas() { return this.cuentas; }

  getCuentaById(id: number): ICuenta | undefined {
    return this.cuentas().find(c => c.id === id);
  }

  loadAll(busqueda?: string) {
    let params = new HttpParams();
    const q = busqueda?.trim();
    if (q) params = params.set('busqueda', q);

    return this.http.get<ApiResponse<ICuenta[] | Page<ICuenta>>>(this.apiUrl, { params }).pipe(
      map(res => (Array.isArray(res.data) ? res.data : res.data?.content) ?? []),
      tap(data => this.cuentas.set(data))
    );
  }

  addCuenta(cuenta: ICuenta) {
    return this.http.post<ApiResponse<ICuenta>>(this.apiUrl, cuenta).pipe(
      map(res => res.data),
      tap(newCuenta => this.cuentas.update(cts => [...cts, newCuenta]))
    );
  }

  updateCuenta(cuenta: ICuenta) {
    return this.http.put<ApiResponse<ICuenta>>(`${this.apiUrl}/${cuenta.id}`, cuenta).pipe(
      map(res => res.data),
      tap(updatedCuenta => this.cuentas.update(cts => cts.map(c => c.id === updatedCuenta.id ? updatedCuenta : c)))
    );
  }

  deleteCuenta(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cuentas.update(cts => cts.filter(c => c.id !== id)))
    );
  }

  updateSaldoLocal(cuentaId: number, saldoInicial: number) {
    this.cuentas.update(c => c.map(x => x.id === cuentaId ? { ...x, saldoInicial } : x));
  }
}
