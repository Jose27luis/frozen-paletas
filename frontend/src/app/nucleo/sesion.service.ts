import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Sesion, UsuarioSesion } from './modelos';

const LLAVE_TOKEN = 'frozen.token';
const LLAVE_USUARIO = 'frozen.usuario';

export const RUTA_RENOVAR = '/api/auth/renovar';

const MARGEN_DE_RENOVACION = 0.5;

interface Vigencia {
  emitido: number;
  vence: number;
}

function vigenciaDe(token: string): Vigencia | null {
  const carga = token.split('.')[1];

  if (carga === undefined) {
    return null;
  }

  try {
    const datos: unknown = JSON.parse(atob(carga.replace(/-/g, '+').replace(/_/g, '/')));

    if (typeof datos !== 'object' || datos === null || !('iat' in datos) || !('exp' in datos)) {
      return null;
    }

    const { iat, exp } = datos;

    return typeof iat === 'number' && typeof exp === 'number' ? { emitido: iat, vence: exp } : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenGuardado = signal<string | null>(localStorage.getItem(LLAVE_TOKEN));
  private readonly usuarioGuardado = signal<UsuarioSesion | null>(this.leerUsuario());

  private renovando = false;

  readonly token = this.tokenGuardado.asReadonly();
  readonly usuario = this.usuarioGuardado.asReadonly();
  readonly autenticado = computed(() => this.tokenGuardado() !== null);
  readonly nombreCorto = computed(() => this.usuarioGuardado()?.nombres ?? '');

  async entrar(correo: string, password: string): Promise<void> {
    this.adoptar(
      await firstValueFrom(this.http.post<Sesion>('/api/auth/login', { correo, password })),
    );
  }

  puede(clave: string): boolean {
    return this.usuarioGuardado()?.permisos.includes(clave) ?? false;
  }

  adoptar(sesion: Sesion): void {
    localStorage.setItem(LLAVE_TOKEN, sesion.accessToken);
    localStorage.setItem(LLAVE_USUARIO, JSON.stringify(sesion.usuario));
    this.tokenGuardado.set(sesion.accessToken);
    this.usuarioGuardado.set(sesion.usuario);
  }

  async renovarSiHaceFalta(): Promise<void> {
    const token = this.tokenGuardado();

    if (token === null || this.renovando || document.visibilityState !== 'visible') {
      return;
    }

    const vigencia = vigenciaDe(token);

    if (vigencia === null) {
      return;
    }

    const ahora = Date.now() / 1000;
    const consumido = (ahora - vigencia.emitido) / (vigencia.vence - vigencia.emitido);

    if (consumido < MARGEN_DE_RENOVACION) {
      return;
    }

    this.renovando = true;

    try {
      this.adoptar(await firstValueFrom(this.http.post<Sesion>(RUTA_RENOVAR, {})));
    } catch {
      this.salir();
    } finally {
      this.renovando = false;
    }
  }

  salir(): void {
    localStorage.removeItem(LLAVE_TOKEN);
    localStorage.removeItem(LLAVE_USUARIO);
    this.tokenGuardado.set(null);
    this.usuarioGuardado.set(null);
    void this.router.navigate(['/acceso']);
  }

  private leerUsuario(): UsuarioSesion | null {
    const guardado = localStorage.getItem(LLAVE_USUARIO);

    if (guardado === null) {
      return null;
    }

    try {
      return JSON.parse(guardado) as UsuarioSesion;
    } catch {
      return null;
    }
  }
}
