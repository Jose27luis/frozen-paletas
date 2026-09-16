import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { animate } from 'motion';
import { Icono } from './icono';

let contador = 0;

@Component({
  selector: 'fz-modal',
  imports: [Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrado.emit()' },
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        #velo
        type="button"
        class="absolute inset-0 bg-tinta/55"
        aria-label="Cerrar sin guardar"
        (click)="cerrado.emit()"
      ></button>

      <div
        #panel
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-labelledby]="id"
        class="relative flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-[var(--radius-lamina)] bg-superficie shadow-2xl outline-none sm:rounded-[var(--radius-lamina)]"
      >
        <header class="flex items-start justify-between gap-4 border-b border-linea p-5">
          <div class="min-w-0">
            <h2 [id]="id" class="titulo text-lg">{{ titulo() }}</h2>
            @if (subtitulo() !== '') {
              <p class="pt-0.5 text-sm text-tenue">{{ subtitulo() }}</p>
            }
          </div>

          <button
            type="button"
            class="shrink-0 rounded-full p-1.5 text-tenue transition-colors hover:bg-hundido hover:text-tinta"
            aria-label="Cerrar"
            (click)="cerrado.emit()"
          >
            <fz-icono nombre="cerrar" />
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto p-5">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class Modal implements OnDestroy {
  protected readonly id = `modal-${contador++}`;

  readonly titulo = input.required<string>();
  readonly subtitulo = input('');

  readonly cerrado = output<void>();

  private readonly velo = viewChild.required<ElementRef<HTMLElement>>('velo');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  private readonly desbordeAnterior = document.body.style.overflow;

  constructor() {
    document.body.style.overflow = 'hidden';

    afterNextRender(() => {
      this.panel().nativeElement.focus();
      this.animarEntrada();
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.desbordeAnterior;
  }

  private animarEntrada(): void {
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    animate(this.velo().nativeElement, { opacity: [0, 1] }, { duration: 0.2 });

    animate(
      this.panel().nativeElement,
      { opacity: [0, 1], transform: ['translateY(16px) scale(0.98)', 'translateY(0) scale(1)'] },
      { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
    );
  }
}
