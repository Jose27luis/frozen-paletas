import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NombreIcono =
  | 'panel'
  | 'inventario'
  | 'produccion'
  | 'salidas'
  | 'mermas'
  | 'lotes'
  | 'sabores'
  | 'usuarios'
  | 'salir'
  | 'desplegar';

@Component({
  selector: 'fz-icono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <svg
      viewBox="0 0 24 24"
      class="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (nombre()) {
        @case ('panel') {
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
        }
        @case ('inventario') {
          <path d="M12 3.5 21 8l-9 4.5L3 8l9-4.5Z" />
          <path d="M3 12.5 12 17l9-4.5" />
          <path d="M3 17 12 21.5 21 17" />
        }
        @case ('produccion') {
          <rect x="6.5" y="2.5" width="11" height="14" rx="5.5" />
          <path d="M12 16.5v5" />
        }
        @case ('salidas') {
          <path d="M13.5 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5h8.5" />
          <path d="M17 8.5 20.5 12 17 15.5" />
          <path d="M9.5 12h11" />
        }
        @case ('mermas') {
          <path d="M12 4 21 19.5H3L12 4Z" />
          <path d="M12 10.5v3.5" />
          <path d="M12 17h.01" />
        }
        @case ('lotes') {
          <path
            d="M11.2 3.5H20.5v9.3a1.5 1.5 0 0 1-.44 1.06l-6.2 6.2a1.5 1.5 0 0 1-2.12 0l-7.2-7.2a1.5 1.5 0 0 1 0-2.12l6.2-6.2a1.5 1.5 0 0 1 1.06-.44Z"
          />
          <circle cx="16.4" cy="7.6" r="1.3" />
        }
        @case ('sabores') {
          <path d="M12 3.5s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" />
        }
        @case ('usuarios') {
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
        }
        @case ('desplegar') {
          <path d="m9.5 6 6 6-6 6" />
        }
        @case ('salir') {
          <path d="M15 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h9" />
          <path d="M14.5 8.5 18 12l-3.5 3.5" />
          <path d="M9 12h9" />
        }
      }
    </svg>
  `,
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
}
