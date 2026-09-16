import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TonoBarra = 'marino' | 'hoja' | 'aguaje' | 'granate';

export interface FilaBarra {
  id: string;
  etiqueta: string;
  detalle: string;
  valor: number;
  referencia?: number;
  tono: TonoBarra;
}

const TONOS: Readonly<Record<TonoBarra, string>> = {
  marino: 'bg-helado-hondo',
  hoja: 'bg-hoja',
  aguaje: 'bg-aguaje-vivo',
  granate: 'bg-granate',
};

@Component({
  selector: 'fz-barras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (tope() === 0) {
      <p class="px-2 py-8 text-center text-sm text-tenue">{{ vacio() }}</p>
    } @else {
      <ul class="space-y-0.5">
        @for (fila of datos(); track fila.id) {
          <li
            class="group relative grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-hundido/70 sm:grid-cols-[11rem_1fr_4rem]"
          >
            <span class="truncate text-sm text-tinta">{{ fila.etiqueta }}</span>

            <span class="relative block h-3.5 rounded-full bg-hundido">
              <span
                class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
                [class]="TONOS[fila.tono]"
                [style.width.%]="proporcion(fila.valor)"
              ></span>
              @if (fila.referencia !== undefined && fila.referencia > 0) {
                <span
                  class="absolute -inset-y-1 w-0.5 rounded-full bg-tinta/55"
                  [style.left.%]="proporcion(fila.referencia)"
                ></span>
              }
            </span>

            <span class="cifra text-right text-sm tabular-nums">{{ fila.valor }}</span>

            <span
              class="pointer-events-none absolute -top-1 right-2 z-10 -translate-y-full rounded-[var(--radius-campo)] bg-tinta px-3 py-2 text-xs whitespace-nowrap text-superficie opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
              role="tooltip"
            >
              {{ fila.etiqueta }}: {{ fila.detalle }}
            </span>
          </li>
        }
      </ul>
    }
  `,
})
export class Barras {
  protected readonly TONOS = TONOS;

  readonly datos = input.required<readonly FilaBarra[]>();
  readonly vacio = input('Sin movimientos en el periodo.');

  protected readonly tope = computed(() =>
    this.datos().reduce((maximo, fila) => Math.max(maximo, fila.valor, fila.referencia ?? 0), 0),
  );

  protected proporcion(valor: number): number {
    const tope = this.tope();

    return tope === 0 ? 0 : Math.round((valor / tope) * 1000) / 10;
  }
}
