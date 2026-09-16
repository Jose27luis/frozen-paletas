import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { animate, stagger } from 'motion';
import { PERMISOS, ROLES } from '../nucleo/etiquetas';
import { SesionService } from '../nucleo/sesion.service';
import { Avisos } from './avisos';
import { Icono, NombreIcono } from './icono';

interface Enlace {
  ruta: string;
  texto: string;
  icono: NombreIcono;
  permiso: string;
}

const ENLACES: readonly Enlace[] = [
  { ruta: '/panel', texto: 'Panel', icono: 'panel', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  {
    ruta: '/inventario',
    texto: 'Inventario',
    icono: 'inventario',
    permiso: PERMISOS.CONSULTAR_INVENTARIO,
  },
  {
    ruta: '/produccion',
    texto: 'Producción',
    icono: 'produccion',
    permiso: PERMISOS.CONSULTAR_INVENTARIO,
  },
  { ruta: '/salidas', texto: 'Salidas', icono: 'salidas', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/mermas', texto: 'Mermas', icono: 'mermas', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/lotes', texto: 'Lotes', icono: 'lotes', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  { ruta: '/sabores', texto: 'Sabores', icono: 'sabores', permiso: PERMISOS.CONSULTAR_INVENTARIO },
  {
    ruta: '/usuarios',
    texto: 'Usuarios',
    icono: 'usuarios',
    permiso: PERMISOS.ADMINISTRAR_USUARIOS,
  },
];

const ENLACE =
  'group relative flex items-center gap-3 overflow-hidden rounded-[var(--radius-campo)] px-3 py-2.5 text-sm transition-colors duration-200 hover:bg-superficie/10 hover:text-superficie';

const ENLACE_ACTIVO = 'bg-superficie/12 text-superficie';
const ENLACE_INACTIVO = 'text-superficie/70';

const ICONO = 'flex transition-colors duration-200';
const ICONO_ACTIVO = 'text-helado';
const ICONO_INACTIVO = 'text-superficie/55 group-hover:text-helado';

@Component({
  selector: 'fz-marco',
  imports: [Avisos, Icono, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh lg:flex">
      <header
        class="border-superficie/10 bg-tinta text-superficie lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between lg:border-r"
      >
        <div>
          <div class="flex items-center justify-between gap-4 px-5 py-4 lg:px-5 lg:py-6">
            <a routerLink="/panel" class="block rounded-xl bg-superficie p-2.5 shadow-sm">
              <img
                src="fronzenlogo.png"
                alt="Frozen Paletas"
                width="486"
                height="168"
                class="h-8 w-auto lg:h-9"
              />
            </a>

            <button
              type="button"
              class="flex items-center gap-2 text-sm text-superficie/70 transition-colors hover:text-superficie lg:hidden"
              (click)="sesion.salir()"
            >
              <fz-icono nombre="salir" />
              Salir
            </button>
          </div>

          <p class="hidden px-5 pb-5 text-xs text-superficie/45 lg:block">Control de inventario</p>

          <nav #barra class="hidden lg:block lg:px-3">
            <ul class="space-y-1">
              @for (enlace of visibles(); track enlace.ruta) {
                <li data-enlace>
                  <a
                    [routerLink]="enlace.ruta"
                    routerLinkActive
                    #activo="routerLinkActive"
                    [class]="claseEnlace(activo.isActive)"
                  >
                    <span
                      aria-hidden="true"
                      class="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-helado transition-transform duration-200 ease-out group-hover:scale-y-100"
                      [class.scale-y-0]="!activo.isActive"
                    ></span>
                    <span [class]="claseIcono(activo.isActive)">
                      <fz-icono [nombre]="enlace.icono" />
                    </span>
                    <span class="transition-transform duration-200 group-hover:translate-x-0.5">{{
                      enlace.texto
                    }}</span>
                  </a>
                </li>
              }
            </ul>
          </nav>
        </div>

        <nav class="overflow-x-auto border-t border-superficie/10 px-3 lg:hidden">
          <ul class="flex gap-1 py-2">
            @for (enlace of visibles(); track enlace.ruta) {
              <li>
                <a
                  [routerLink]="enlace.ruta"
                  routerLinkActive="bg-superficie/12 text-superficie"
                  class="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-superficie/70 transition-colors"
                >
                  <fz-icono [nombre]="enlace.icono" />
                  {{ enlace.texto }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <div class="hidden border-t border-superficie/10 px-5 py-5 lg:block">
          <div class="flex items-center gap-3">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-full bg-helado text-sm font-medium text-tinta"
              aria-hidden="true"
              >{{ iniciales() }}</span
            >
            <span class="min-w-0">
              <span class="block truncate text-sm">{{ sesion.nombreCorto() }}</span>
              <span class="block truncate text-xs text-superficie/55">{{ rol() }}</span>
            </span>
          </div>

          <button
            type="button"
            class="mt-4 flex items-center gap-2 text-sm text-superficie/65 transition-colors hover:text-helado"
            (click)="sesion.salir()"
          >
            <fz-icono nombre="salir" />
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

  private readonly barra = viewChild<ElementRef<HTMLElement>>('barra');

  protected readonly visibles = computed(() =>
    ENLACES.filter((enlace) => this.sesion.puede(enlace.permiso)),
  );

  protected readonly rol = computed(() => {
    const usuario = this.sesion.usuario();

    return usuario === null ? '' : ROLES[usuario.rol];
  });

  protected readonly iniciales = computed(() => {
    const usuario = this.sesion.usuario();

    if (usuario === null) {
      return '';
    }

    return `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase();
  });

  constructor() {
    afterNextRender(() => {
      this.animarBarra();
    });
  }

  protected claseEnlace(activo: boolean): string {
    return `${ENLACE} ${activo ? ENLACE_ACTIVO : ENLACE_INACTIVO}`;
  }

  protected claseIcono(activo: boolean): string {
    return `${ICONO} ${activo ? ICONO_ACTIVO : ICONO_INACTIVO}`;
  }

  private animarBarra(): void {
    const barra = this.barra()?.nativeElement;

    if (barra === undefined || globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    animate(
      barra.querySelectorAll<HTMLElement>('[data-enlace]'),
      { opacity: [0, 1], transform: ['translateX(-10px)', 'translateX(0px)'] },
      { duration: 0.35, delay: stagger(0.04), ease: [0.16, 1, 0.3, 1] },
    );
  }
}
