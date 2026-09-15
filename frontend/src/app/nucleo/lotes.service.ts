import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EstadoLote, Lote } from './modelos';
import { aParametros } from './parametros';

export interface FiltroLotes {
  saborId?: string;
  estado?: EstadoLote;
  conStock?: boolean;
  desde?: string;
  hasta?: string;
  limite?: number;
}

@Injectable({ providedIn: 'root' })
export class LotesService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltroLotes): Promise<Lote[]> {
    return firstValueFrom(
      this.http.get<Lote[]>('/api/lotes', { params: aParametros({ ...filtros }) }),
    );
  }

  porCodigo(codigo: string): Promise<Lote> {
    return firstValueFrom(this.http.get<Lote>(`/api/lotes/codigo/${codigo}`));
  }
}
