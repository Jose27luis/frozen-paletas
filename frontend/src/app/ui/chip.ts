import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TonoChip = 'neutro' | 'hoja' | 'aguaje' | 'granate' | 'helado';

const TONOS: Readonly<Record<TonoChip, string>> = {
  neutro: 'bg-hundido text-tenue',
  hoja: 'bg-hoja/12 text-hoja',
  aguaje: 'bg-aguaje/12 text-aguaje',
  granate: 'bg-granate/12 text-granate',
  helado: 'bg-helado/12 text-helado-hondo',
};

@Component({
  selector: 'fz-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      [class]="TONOS[tono()]"
    >
      <ng-content />
    </span>
  `,
})
export class Chip {
  protected readonly TONOS = TONOS;

  readonly tono = input<TonoChip>('neutro');
}
