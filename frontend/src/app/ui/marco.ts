import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PERMISOS } from '../nucleo/etiquetas';
import { ROLES } from '../nucleo/etiquetas';
import { SesionService } from '../nucleo/sesion.service';
import { Avisos } from './avisos';

interface Enlace {
  ruta: string;
  texto: string;
  permiso: string;
}

const ENLACES: readonly Enlace[] = [
  { ruta: '/panel', texto: 'Panel', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/inventario', texto: 'Inventario', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/produccion', texto: 'Producción', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/salidas', texto: 'Salidas', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/mermas', texto: 'Mermas', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/lotes', texto: 'Lotes', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/sabores', texto: 'Sabores', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/usuarios', texto: 'Usuarios', permiso: PERMISOS.ADMINISTRAR_USUARIOS },
];

@Component({
  selector: 'fz-marco',
  imports: [Avisos, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh lg:flex">
      <header
        class="bg-tinta text-superficie lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:justify-between"
      >
        <div class="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-6 lg:py-7">
          <a routerLink="/panel" class="block">
            <span class="titulo block text-xl tracking-tight">Frozen</span>
            <span class="block text-xs text-superficie/60">Paletas artesanales</span>
          </a>

          <nav class="hidden lg:mt-8 lg:block">
            <ul class="space-y-0.5">
              @for (enlace of visibles(); track enlace.ruta) {
                <li>
                  <a
                    [routerLink]="enlace.ruta"
                    routerLinkActive="bg-superficie/10 text-superficie"
                    class="block rounded-[var(--radius-campo)] px-3 py-2 text-sm text-superficie/70 transition-colors hover:text-superficie"
                    >{{ enlace.texto }}</a
                  >
                </li>
              }
            </ul>
          </nav>

          <button
            type="button"
            class="text-sm text-superficie/70 transition-colors hover:text-superficie lg:hidden"
            (click)="sesion.salir()"
          >
            Salir
          </button>
        </div>

        <nav class="overflow-x-auto border-t border-superficie/10 px-3 lg:hidden">
          <ul class="flex gap-1 py-2">
            @for (enlace of visibles(); track enlace.ruta) {
              <li>
                <a
                  [routerLink]="enlace.ruta"
                  routerLinkActive="bg-superficie/10 text-superficie"
                  class="block rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-superficie/70"
                  >{{ enlace.texto }}</a
                >
              </li>
            }
          </ul>
        </nav>

        <div class="hidden px-6 py-6 lg:block">
          <p class="text-sm text-superficie">{{ sesion.nombreCorto() }}</p>
          <p class="text-xs text-superficie/60">{{ rol() }}</p>
          <button
            type="button"
            class="mt-3 text-sm text-superficie/70 transition-colors hover:text-superficie"
            (click)="sesion.salir()"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main class="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-10">
        <router-outlet />
      </main>
    </div>

    <fz-avisos />
  `,
})
export class Marco {
  protected readonly sesion = inject(SesionService);

  protected readonly visibles = computed(() =>
    ENLACES.filter((enlace) => this.sesion.puede(enlace.permiso)),
  );

  protected readonly rol = computed(() => {
    const usuario = this.sesion.usuario();

    return usuario === null ? '' : ROLES[usuario.rol];
  });
}
