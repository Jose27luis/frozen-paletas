import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CausaMerma, Merma, OrigenMerma } from './modelos';
import { aParametros } from './parametros';

export interface DatosMerma {
  saborId: string;
  cantidad: number;
  causaId: string;
  claveIdempotencia: string;
  fecha?: string;
  loteId?: string;
  observacion?: string;
}

export interface FiltroMermas {
  saborId?: string;
  causaId?: string;
  origen?: OrigenMerma;
  desde?: string;
  hasta?: string;
  limite?: number;
}

@Injectable({ providedIn: 'root' })
export class MermasService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltroMermas): Promise<Merma[]> {
    return firstValueFrom(
      this.http.get<Merma[]>('/api/mermas', { params: aParametros({ ...filtros }) }),
    );
  }

  causas(): Promise<CausaMerma[]> {
    return firstValueFrom(this.http.get<CausaMerma[]>('/api/mermas/causas'));
  }

  registrar(datos: DatosMerma): Promise<Merma> {
    return firstValueFrom(this.http.post<Merma>('/api/mermas', datos));
  }
}
