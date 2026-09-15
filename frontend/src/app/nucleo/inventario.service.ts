import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Inventario, Movimiento, StockSabor, TipoMovimiento } from './modelos';
import { aParametros } from './parametros';

export interface FiltroMovimientos {
  saborId?: string;
  loteId?: string;
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
  limite?: number;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);

  resumen(): Promise<Inventario> {
    return firstValueFrom(this.http.get<Inventario>('/api/inventario'));
  }

  aReponer(): Promise<StockSabor[]> {
    return firstValueFrom(this.http.get<StockSabor[]>('/api/inventario/reponer'));
  }

  movimientos(filtros: FiltroMovimientos): Promise<Movimiento[]> {
    return firstValueFrom(
      this.http.get<Movimiento[]>('/api/inventario/movimientos', {
        params: aParametros({ ...filtros }),
      }),
    );
  }
}
