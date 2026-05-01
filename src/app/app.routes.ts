import { Routes } from '@angular/router';
import { ClientesComponent } from './pages/clientes/clientes';
import { CuentasComponent } from './pages/cuentas/cuentas';
import { MovimientosComponent } from './pages/movimientos/movimientos';
import { ReportesComponent } from './pages/reportes/reportes';

export const routes: Routes = [
  { path: 'clientes', component: ClientesComponent },
  { path: 'cuentas', component: CuentasComponent },
  { path: 'movimientos', component: MovimientosComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: '', redirectTo: '/clientes', pathMatch: 'full' },
  { path: '**', redirectTo: '/clientes' }
];
