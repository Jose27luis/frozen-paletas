import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Salida, TipoSalida } from './modelos';
import { aParametros } from './parametros';

export interface LineaSalida {
  saborId: string;
  cantidad: number;
  loteId?: string;
  precioUnitario?: number;
}

export interface DatosSalida {
  tipo: TipoSalida;
  detalles: LineaSalida[];
  claveIdempotencia: string;
  fecha?: string;
  destinoId?: string;
  motivo?: string;
}

export interface FiltroSalidas {
  tipo?: TipoSalida;
  destinoId?: string;
  desde?: string;
  hasta?: string;
  limite?: number;
}

@Injectable({ providedIn: 'root' })
export class SalidasService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltroSalidas): Promise<Salida[]> {
    return firstValueFrom(
      this.http.get<Salida[]>('/api/salidas', { params: aParametros({ ...filtros }) }),
    );
  }

  registrar(datos: DatosSalida): Promise<Salida> {
    return firstValueFrom(this.http.post<Salida>('/api/salidas', datos));
  }
}
