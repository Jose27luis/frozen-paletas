import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

const CLASES_CONTROL =
  'h-11 w-full rounded-[var(--radius-campo)] border border-linea bg-superficie px-3.5 text-sm tabular-nums text-tinta transition-colors focus:border-helado focus:outline-none disabled:opacity-50';

@Component({
  selector: 'fz-campo-numero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label class="block">
      <span class="rotulo block pb-1.5">{{ etiqueta() }}</span>
      <input
        type="number"
        inputmode="numeric"
        [value]="valor() ?? ''"
        [min]="minimo()"
        [disabled]="deshabilitado()"
        [class]="CLASES_CONTROL"
        (input)="alEscribir($event)"
      />
      @if (ayuda() !== '') {
        <span class="block pt-1.5 text-xs text-tenue">{{ ayuda() }}</span>
      }
    </label>
  `,
})
export class CampoNumero {
  protected readonly CLASES_CONTROL = CLASES_CONTROL;

  readonly etiqueta = input.required<string>();
  readonly ayuda = input('');
  readonly minimo = input(0);
  readonly deshabilitado = input(false);
  readonly valor = model<number | null>(null);

  protected alEscribir(evento: Event): void {
    const texto = (evento.target as HTMLInputElement).value;

    this.valor.set(texto === '' ? null : Number(texto));
  }
}
