import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'fz-cargador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      [class.size-4]="tamano() === 'sm'"
      [class.size-6]="tamano() === 'md'"
      role="status"
    >
      <span class="sr-only">Cargando</span>
    </span>
  `,
})
export class Cargador {
  readonly tamano = input<'sm' | 'md'>('md');
}
