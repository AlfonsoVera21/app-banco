export interface IMovimiento {
  id?: number;
  fecha: Date;
  tipoMovimiento: 'DEPOSITO' | 'RETIRO';
  valor: number;
  saldo: number;
  cuentaId: number;
}
