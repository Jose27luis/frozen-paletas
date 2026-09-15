import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

const CLASES_CONTROL =
  'h-11 w-full rounded-[var(--radius-campo)] border border-linea bg-superficie px-3.5 text-sm text-tinta transition-colors focus:border-helado focus:outline-none disabled:opacity-50';

@Component({
  selector: 'fz-campo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label class="block">
      <span class="rotulo block pb-1.5">{{ etiqueta() }}</span>
      <input
        [type]="tipo()"
        [value]="valor()"
        [disabled]="deshabilitado()"
        [autocomplete]="autocompletado()"
        [class]="CLASES_CONTROL"
        (input)="alEscribir($event)"
      />
      @if (ayuda() !== '') {
        <span class="block pt-1.5 text-xs text-tenue">{{ ayuda() }}</span>
      }
    </label>
  `,
})
export class Campo {
  protected readonly CLASES_CONTROL = CLASES_CONTROL;

  readonly etiqueta = input.required<string>();
  readonly tipo = input<'text' | 'password' | 'email' | 'date'>('text');
  readonly ayuda = input('');
  readonly autocompletado = input('off');
  readonly deshabilitado = input(false);
  readonly valor = model('');

  protected alEscribir(evento: Event): void {
    this.valor.set((evento.target as HTMLInputElement).value);
  }
}
