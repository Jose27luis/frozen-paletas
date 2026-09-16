import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { animate, stagger } from 'motion';
import { mensajeDe } from '../nucleo/errores';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';

const SUAVE = [0.16, 1, 0.3, 1] as const;

@Component({
  selector: 'fz-acceso-pagina',
  imports: [Boton, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh bg-fondo lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section class="relative h-56 overflow-hidden bg-tinta sm:h-72 lg:h-auto">
        <img
          #foto
          src="fronzenpaleta.png"
          alt="Paletas de fresa y de coco con manjar a la orilla del río, en Puerto Maldonado"
          class="absolute inset-0 size-full object-cover object-[center_38%]"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-tinta via-tinta/45 to-tinta/5"
          aria-hidden="true"
        ></div>

        <div class="absolute inset-x-0 bottom-0 p-6 lg:p-12">
          <p class="titulo max-w-md text-xl text-superficie lg:text-4xl">
            El recorrido de cada paleta, desde el balde hasta la puerta.
          </p>
          <p class="hidden max-w-sm pt-3 text-sm text-superficie/75 lg:block">
            Producción, embolsado, stock por sabor, salidas y mermas de Frozen en Puerto Maldonado.
          </p>
        </div>
      </section>

      <section class="flex items-center justify-center px-5 py-10 lg:px-10">
        <form
          #tarjeta
          class="w-full max-w-md rounded-[var(--radius-lamina)] border border-linea bg-superficie p-7 shadow-[0_28px_70px_-30px_rgb(20_49_79/0.45)] sm:p-9"
          (submit)="entrar($event)"
        >
          <img
            data-anima
            src="fronzenlogo.png"
            alt="Frozen Paletas"
            width="486"
            height="168"
            class="h-14 w-auto"
          />

          <span
            data-anima
            class="mt-5 flex h-1 w-28 overflow-hidden rounded-full"
            aria-hidden="true"
          >
            <span class="flex-1 bg-helado"></span>
            <span class="flex-1 bg-granate"></span>
            <span class="flex-1 bg-helado-hondo"></span>
          </span>

          <div data-anima>
            <h1 class="titulo pt-7 text-2xl">Entrar</h1>
            <p class="pt-1 text-sm text-tenue">Usa el correo con el que te dieron de alta.</p>
          </div>

          <div data-anima class="pt-7">
            <fz-campo etiqueta="Correo" tipo="email" autocompletado="username" [(valor)]="correo" />
          </div>

          <div data-anima class="pt-4">
            <fz-campo
              etiqueta="Contraseña"
              tipo="password"
              autocompletado="current-password"
              [(valor)]="password"
            />
          </div>

          @if (error() !== '') {
            <p class="pt-4 text-sm text-granate">{{ error() }}</p>
          }

          <div data-anima class="pt-7">
            <fz-boton tipo="submit" [ocupado]="enviando()" [ancho]="true">Entrar</fz-boton>
          </div>

          <p data-anima class="pt-6 text-xs text-tenue">
            ¿Sin acceso? Pídeselo a quien administra el sistema.
          </p>
        </form>
      </section>
    </div>
  `,
})
export class AccesoPagina {
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  private readonly foto = viewChild.required<ElementRef<HTMLImageElement>>('foto');
  private readonly tarjeta = viewChild.required<ElementRef<HTMLFormElement>>('tarjeta');

  protected readonly correo = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly enviando = signal(false);

  constructor() {
    afterNextRender(() => {
      this.animarEntrada();
    });
  }

  protected async entrar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);
    this.error.set('');

    try {
      await this.sesion.entrar(this.correo().trim(), this.password());
      await this.router.navigate(['/panel']);
    } catch (error: unknown) {
      this.error.set(mensajeDe(error));
      this.sacudir();
    } finally {
      this.enviando.set(false);
    }
  }

  private animarEntrada(): void {
    if (this.prefiereQuietud()) {
      return;
    }

    animate(
      this.foto().nativeElement,
      { transform: ['scale(1.06)', 'scale(1)'], opacity: [0.55, 1] },
      { duration: 0.9, ease: SUAVE },
    );

    animate(
      this.tarjeta().nativeElement,
      { opacity: [0, 1], transform: ['translateY(22px)', 'translateY(0px)'] },
      { duration: 0.55, ease: SUAVE },
    );

    animate(
      this.tarjeta().nativeElement.querySelectorAll<HTMLElement>('[data-anima]'),
      { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] },
      { duration: 0.45, delay: stagger(0.06, { startDelay: 0.14 }), ease: SUAVE },
    );
  }

  private sacudir(): void {
    if (this.prefiereQuietud()) {
      return;
    }

    animate(
      this.tarjeta().nativeElement,
      { transform: ['translateX(0px)', 'translateX(-7px)', 'translateX(6px)', 'translateX(0px)'] },
      { duration: 0.32 },
    );
  }

  private prefiereQuietud(): boolean {
    return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
