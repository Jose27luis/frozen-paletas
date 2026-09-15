import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';

@Component({
  selector: 'fz-avisos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      @for (aviso of avisos.avisos(); track aviso.id) {
        <button
          type="button"
          class="pointer-events-auto max-w-md rounded-[var(--radius-campo)] border px-4 py-3 text-left text-sm shadow-lg"
          [class]="
            aviso.tono === 'error'
              ? 'border-granate/30 bg-granate text-superficie'
              : 'border-helado-hondo/30 bg-helado text-superficie'
          "
          (click)="avisos.cerrar(aviso.id)"
        >
          {{ aviso.texto }}
        </button>
      }
    </div>
  `,
})
export class Avisos {
  protected readonly avisos = inject(AvisosService);
}
