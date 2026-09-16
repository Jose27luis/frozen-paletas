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

export interface MermaPorCausa {
  causa: string;
  cantidad: number;
  registros: number;
}

export interface MermaPorSabor {
  sabor: string;
  cantidad: number;
}

export interface ResumenMermas {
  desde: string;
  hasta: string;
  total: number;
  enAlmacen: number;
  enProceso: number;
  porCausa: MermaPorCausa[];
  porSabor: MermaPorSabor[];
}

@Injectable({ providedIn: 'root' })
export class MermasService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltroMermas): Promise<Merma[]> {
    return firstValueFrom(
      this.http.get<Merma[]>('/api/mermas', { params: aParametros({ ...filtros }) }),
    );
  }

  resumen(desde: string, hasta: string): Promise<ResumenMermas> {
    return firstValueFrom(
      this.http.get<ResumenMermas>('/api/mermas/resumen', {
        params: aParametros({ desde, hasta }),
      }),
    );
  }

  causas(): Promise<CausaMerma[]> {
    return firstValueFrom(this.http.get<CausaMerma[]>('/api/mermas/causas'));
  }

  crearCausa(nombre: string, requiereDescripcion: boolean): Promise<CausaMerma> {
    return firstValueFrom(
      this.http.post<CausaMerma>('/api/mermas/causas', { nombre, requiereDescripcion }),
    );
  }

  desactivarCausa(id: string): Promise<CausaMerma> {
    return firstValueFrom(this.http.post<CausaMerma>(`/api/mermas/causas/${id}/desactivar`, {}));
  }

  eliminarCausa(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/mermas/causas/${id}`));
  }

  activarCausa(id: string): Promise<CausaMerma> {
    return firstValueFrom(this.http.post<CausaMerma>(`/api/mermas/causas/${id}/activar`, {}));
  }

  registrar(datos: DatosMerma): Promise<Merma> {
    return firstValueFrom(this.http.post<Merma>('/api/mermas', datos));
  }
}
