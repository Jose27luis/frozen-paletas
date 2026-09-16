import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'fz-kpi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <button
      type="button"
      [attr.aria-pressed]="activo()"
      class="group relative w-full overflow-hidden rounded-[var(--radius-lamina)] border bg-superficie p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgb(20_49_79/0.55)]"
      [class]="
        activo()
          ? 'border-helado-hondo shadow-[0_18px_40px_-26px_rgb(20_49_79/0.55)]'
          : 'border-linea'
      "
      (click)="elegido.emit()"
    >
      <span
        aria-hidden="true"
        class="absolute inset-x-0 top-0 h-1 origin-left bg-helado transition-transform duration-200"
        [class.scale-x-0]="!activo()"
      ></span>

      <span class="rotulo block">{{ etiqueta() }}</span>
      <span class="cifra block pt-1.5 text-3xl text-tinta">{{ valor() }}</span>
      <span class="block pt-1 text-xs text-tenue">{{ apunte() }}</span>
    </button>
  `,
})
export class Kpi {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string>();
  readonly apunte = input('');
  readonly activo = input(false);

  readonly elegido = output<void>();
}
