import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CategoriaSabor, EstadoSabor, Sabor } from './modelos';
import { aParametros } from './parametros';

export interface DatosSabor {
  nombre: string;
  abreviatura: string;
  categoria: CategoriaSabor;
  estado?: EstadoSabor;
  stockMinimo?: number;
  precio?: number;
}

@Injectable({ providedIn: 'root' })
export class SaboresService {
  private readonly http = inject(HttpClient);

  listar(estado?: EstadoSabor): Promise<Sabor[]> {
    return firstValueFrom(
      this.http.get<Sabor[]>('/api/sabores', { params: aParametros({ estado }) }),
    );
  }

  crear(datos: DatosSabor): Promise<Sabor> {
    return firstValueFrom(this.http.post<Sabor>('/api/sabores', datos));
  }

  actualizar(id: string, datos: Partial<DatosSabor>): Promise<Sabor> {
    return firstValueFrom(this.http.patch<Sabor>(`/api/sabores/${id}`, datos));
  }

  desactivar(id: string): Promise<Sabor> {
    return firstValueFrom(this.http.delete<Sabor>(`/api/sabores/${id}`));
  }

  activar(id: string): Promise<Sabor> {
    return firstValueFrom(this.http.post<Sabor>(`/api/sabores/${id}/activar`, {}));
  }
}
