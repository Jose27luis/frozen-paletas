import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

const CLASES_CONTROL =
  'h-11 w-full rounded-[var(--radius-campo)] border border-linea bg-superficie px-3.5 text-sm text-tinta transition-colors focus:border-helado focus:outline-none disabled:opacity-50';

@Component({
  selector: 'fz-campo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <label class="block">
      <span class="rotulo block pb-1.5">{{ etiqueta() }}</span>
      <span class="relative block">
        <input
          [type]="tipoReal()"
          [value]="valor()"
          [disabled]="deshabilitado()"
          [autocomplete]="autocompletado()"
          [class]="CLASES_CONTROL"
          [class.pr-12]="esPassword()"
          (input)="alEscribir($event)"
        />

        @if (esPassword()) {
          <button
            type="button"
            class="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-tenue transition-colors hover:text-helado-hondo"
            [attr.aria-label]="visible() ? 'Ocultar la contraseña' : 'Mostrar la contraseña'"
            [attr.aria-pressed]="visible()"
            (click)="alternar()"
          >
            <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
              <path
                d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="12" cy="12" r="3.1" stroke="currentColor" stroke-width="1.6" />
              @if (visible()) {
                <path
                  d="M4 20 20 4"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              }
            </svg>
          </button>
        }
      </span>
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

  protected readonly visible = signal(false);

  protected readonly esPassword = computed(() => this.tipo() === 'password');

  protected readonly tipoReal = computed(() =>
    this.esPassword() && this.visible() ? 'text' : this.tipo(),
  );

  protected alternar(): void {
    this.visible.update((visible) => !visible);
  }

  protected alEscribir(evento: Event): void {
    this.valor.set((evento.target as HTMLInputElement).value);
  }
}
