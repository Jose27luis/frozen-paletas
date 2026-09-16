import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Cargador } from './cargador';

type Tono = 'primario' | 'contorno' | 'fantasma' | 'alerta';

const TONOS: Readonly<Record<Tono, string>> = {
  primario: 'bg-helado-hondo text-superficie hover:bg-tinta',
  contorno: 'border border-linea text-tinta hover:border-helado hover:text-helado-hondo',
  fantasma: 'text-tenue hover:text-helado-hondo',
  alerta: 'border border-granate/40 text-granate hover:bg-granate hover:text-superficie',
};

@Component({
  selector: 'fz-boton',
  imports: [Cargador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <button
      [type]="tipo()"
      [disabled]="ocupado() || deshabilitado()"
      class="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-campo)] px-5 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40"
      [class]="TONOS[tono()]"
      [class.w-full]="ancho()"
    >
      @if (ocupado()) {
        <fz-cargador tamano="sm" />
      }
      <ng-content />
    </button>
  `,
})
export class Boton {
  protected readonly TONOS = TONOS;

  readonly tono = input<Tono>('primario');
  readonly tipo = input<'button' | 'submit'>('button');
  readonly ocupado = input(false);
  readonly deshabilitado = input(false);
  readonly ancho = input(false);
}
