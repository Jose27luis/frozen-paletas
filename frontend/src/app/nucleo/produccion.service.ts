import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EstadoProduccion, Produccion } from './modelos';
import { aParametros } from './parametros';

export interface DatosProduccion {
  saborId: string;
  cantidadObtenida: number;
  fecha?: string;
  claveIdempotencia: string;
}

export interface DatosEmbolsado {
  cantidadEmbolsada: number;
  causaId?: string;
  observacion?: string;
}

export interface FiltroProducciones {
  saborId?: string;
  estado?: EstadoProduccion;
  desde?: string;
  hasta?: string;
  limite?: number;
}

@Injectable({ providedIn: 'root' })
export class ProduccionService {
  private readonly http = inject(HttpClient);

  listar(filtros: FiltroProducciones): Promise<Produccion[]> {
    return firstValueFrom(
      this.http.get<Produccion[]>('/api/produccion', { params: aParametros({ ...filtros }) }),
    );
  }

  pendientes(): Promise<Produccion[]> {
    return firstValueFrom(this.http.get<Produccion[]>('/api/produccion/pendientes'));
  }

  registrar(datos: DatosProduccion): Promise<Produccion> {
    return firstValueFrom(this.http.post<Produccion>('/api/produccion', datos));
  }

  embolsar(id: string, datos: DatosEmbolsado): Promise<Produccion> {
    return firstValueFrom(this.http.post<Produccion>(`/api/produccion/${id}/embolsado`, datos));
  }

  anular(id: string, motivo: string): Promise<Produccion> {
    return firstValueFrom(this.http.post<Produccion>(`/api/produccion/${id}/anular`, { motivo }));
  }
}
