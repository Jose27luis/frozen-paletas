import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Permiso, Rol, Usuario } from './modelos';

export interface DatosUsuario {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
  rol: Rol;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  listar(): Promise<Usuario[]> {
    return firstValueFrom(this.http.get<Usuario[]>('/api/usuarios'));
  }

  crear(datos: DatosUsuario): Promise<Usuario> {
    return firstValueFrom(this.http.post<Usuario>('/api/usuarios', datos));
  }

  desactivar(id: string): Promise<Usuario> {
    return firstValueFrom(this.http.delete<Usuario>(`/api/usuarios/${id}`));
  }

  reactivar(id: string): Promise<Usuario> {
    return firstValueFrom(this.http.post<Usuario>(`/api/usuarios/${id}/reactivar`, {}));
  }

  permisos(): Promise<Permiso[]> {
    return firstValueFrom(this.http.get<Permiso[]>('/api/permisos'));
  }

  guardarPermisos(rol: Rol, claves: string[]): Promise<Permiso[]> {
    return firstValueFrom(this.http.put<Permiso[]>(`/api/permisos/${rol}`, { claves }));
  }
}
