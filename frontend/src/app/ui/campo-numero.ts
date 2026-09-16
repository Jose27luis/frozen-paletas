import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  model,
} from '@angular/core';

const CLASES_CONTROL =
  'h-11 w-full rounded-[var(--radius-campo)] border border-linea bg-superficie px-3.5 text-sm tabular-nums text-tinta transition-colors focus:border-helado focus:outline-none disabled:opacity-50';

let contador = 0;

@Component({
  selector: 'fz-campo-numero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label class="block" [attr.for]="id">
      <span class="rotulo block pb-1.5">{{ etiqueta() }}</span>

      @if (admiteDecimales()) {
        <input
          type="text"
          inputmode="decimal"
          [id]="id"
          [value]="texto()"
          [disabled]="deshabilitado()"
          [class]="CLASES_CONTROL"
          (input)="alEscribirDecimal($event)"
        />
      } @else {
        <input
          type="number"
          inputmode="numeric"
          [id]="id"
          [step]="paso()"
          [value]="valor() ?? ''"
          [min]="minimo()"
          [disabled]="deshabilitado()"
          [class]="CLASES_CONTROL"
          (input)="alEscribir($event)"
        />
      }

      @if (ayuda() !== '') {
        <span class="block pt-1.5 text-xs text-tenue">{{ ayuda() }}</span>
      }
    </label>
  `,
})
export class CampoNumero {
  protected readonly CLASES_CONTROL = CLASES_CONTROL;
  protected readonly id = `campo-numero-${contador++}`;

  readonly etiqueta = input.required<string>();
  readonly ayuda = input('');
  readonly minimo = input(0);
  readonly paso = input(1);
  readonly deshabilitado = input(false);
  readonly valor = model<number | null>(null);

  protected readonly admiteDecimales = computed(() => this.paso() < 1);

  protected readonly texto = linkedSignal(() => {
    const valor = this.valor();

    return valor === null ? '' : String(valor);
  });

  protected alEscribir(evento: Event): void {
    const escrito = (evento.target as HTMLInputElement).value;

    this.valor.set(escrito === '' ? null : Number(escrito));
  }

  protected alEscribirDecimal(evento: Event): void {
    const escrito = (evento.target as HTMLInputElement).value;

    this.texto.set(escrito);

    const limpio = escrito.replace(',', '.').trim();

    if (limpio === '') {
      this.valor.set(null);
      return;
    }

    const numero = Number(limpio);

    this.valor.set(Number.isNaN(numero) ? null : numero);
  }
}
