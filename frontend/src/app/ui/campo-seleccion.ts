import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface Opcion {
  valor: string;
  texto: string;
}

const CLASES_CONTROL =
  'h-11 w-full appearance-none rounded-[var(--radius-campo)] border border-linea bg-superficie px-3.5 text-sm text-tinta transition-colors focus:border-helado focus:outline-none disabled:opacity-50';

@Component({
  selector: 'fz-campo-seleccion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label class="block">
      <span class="rotulo block pb-1.5">{{ etiqueta() }}</span>
      <span class="relative block">
        <select
          [value]="valor()"
          [disabled]="deshabilitado()"
          [class]="CLASES_CONTROL"
          (change)="alElegir($event)"
        >
          @if (vacio() !== '') {
            <option value="">{{ vacio() }}</option>
          }
          @for (opcion of opciones(); track opcion.valor) {
            <option [value]="opcion.valor">{{ opcion.texto }}</option>
          }
        </select>
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-tenue"
          >▾</span
        >
      </span>
      @if (ayuda() !== '') {
        <span class="block pt-1.5 text-xs text-tenue">{{ ayuda() }}</span>
      }
    </label>
  `,
})
export class CampoSeleccion {
  protected readonly CLASES_CONTROL = CLASES_CONTROL;

  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<readonly Opcion[]>();
  readonly vacio = input('');
  readonly ayuda = input('');
  readonly deshabilitado = input(false);
  readonly valor = model('');

  protected alElegir(evento: Event): void {
    this.valor.set((evento.target as HTMLSelectElement).value);
  }
}
