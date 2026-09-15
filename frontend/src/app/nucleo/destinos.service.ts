import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Destino, TipoSalida } from './modelos';
import { aParametros } from './parametros';

export interface DatosDestino {
  tipo: TipoSalida;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class DestinosService {
  private readonly http = inject(HttpClient);

  listar(tipo?: TipoSalida, activo?: boolean): Promise<Destino[]> {
    return firstValueFrom(
      this.http.get<Destino[]>('/api/destinos', { params: aParametros({ tipo, activo }) }),
    );
  }

  crear(datos: DatosDestino): Promise<Destino> {
    return firstValueFrom(this.http.post<Destino>('/api/destinos', datos));
  }

  desactivar(id: string): Promise<Destino> {
    return firstValueFrom(this.http.delete<Destino>(`/api/destinos/${id}`));
  }

  activar(id: string): Promise<Destino> {
    return firstValueFrom(this.http.post<Destino>(`/api/destinos/${id}/activar`, {}));
  }
}
