import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoStock, StockSabor } from '../nucleo/modelos';

const ALTO_CUERPO = 88;
const TOPE_CUERPO = 2;
const ESCALA_SOBRE_MINIMO = 2;

const COLORES: Readonly<Record<EstadoStock, string>> = {
  DISPONIBLE: 'var(--color-hoja)',
  REPONER: 'var(--color-aguaje)',
  AGOTADO: 'var(--color-granate)',
};

const TEXTOS: Readonly<Record<EstadoStock, string>> = {
  DISPONIBLE: 'Disponible',
  REPONER: 'Reponer',
  AGOTADO: 'Agotado',
};

@Component({
  selector: 'fz-paleta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <figure class="m-0 flex flex-col items-center gap-2 text-center">
      <svg viewBox="0 0 56 112" class="h-28 w-14" role="img" [attr.aria-label]="descripcion()">
        <rect x="23" y="84" width="10" height="26" rx="5" fill="#c9a227" />
        <rect
          x="4"
          y="2"
          width="48"
          height="88"
          rx="20"
          fill="var(--color-hundido)"
          stroke="var(--color-linea)"
        />
        <clipPath [attr.id]="idRecorte()">
          <rect x="4" y="2" width="48" height="88" rx="20" />
        </clipPath>
        <g [attr.clip-path]="'url(#' + idRecorte() + ')'">
          <rect
            x="4"
            [attr.y]="inicioRelleno()"
            width="48"
            [attr.height]="altoRelleno()"
            [attr.fill]="color()"
          />
        </g>
        <line
          x1="4"
          x2="52"
          [attr.y1]="alturaMinimo()"
          [attr.y2]="alturaMinimo()"
          stroke="var(--color-tinta)"
          stroke-width="1"
          stroke-dasharray="3 3"
          opacity="0.45"
        />
      </svg>

      <figcaption class="flex flex-col items-center gap-0.5">
        <span class="cifra text-2xl leading-none" [style.color]="color()">{{ sabor().stock }}</span>
        <span class="text-sm leading-tight text-tinta">{{ sabor().abreviatura }}</span>
        <span class="text-xs leading-tight text-tenue">{{ TEXTOS[sabor().estado] }}</span>
      </figcaption>
    </figure>
  `,
})
export class Paleta {
  protected readonly TEXTOS = TEXTOS;

  readonly sabor = input.required<StockSabor>();

  protected readonly color = computed(() => COLORES[this.sabor().estado]);

  protected readonly idRecorte = computed(() => `paleta-${this.sabor().saborId}`);

  protected readonly descripcion = computed(
    () =>
      `${this.sabor().nombre}: ${this.sabor().stock} paletas, mínimo ${this.sabor().stockMinimo}`,
  );

  protected readonly altoRelleno = computed(() => ALTO_CUERPO * this.proporcion());

  protected readonly inicioRelleno = computed(() => TOPE_CUERPO + ALTO_CUERPO - this.altoRelleno());

  protected readonly alturaMinimo = computed(
    () => TOPE_CUERPO + ALTO_CUERPO - ALTO_CUERPO / ESCALA_SOBRE_MINIMO,
  );

  private proporcion(): number {
    const { stock, stockMinimo } = this.sabor();
    const tope = Math.max(stockMinimo, 1) * ESCALA_SOBRE_MINIMO;

    return Math.min(1, Math.max(0, stock / tope));
  }
}
