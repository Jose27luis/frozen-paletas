import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { mensajeDe } from '../nucleo/errores';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';

@Component({
  selector: 'fz-acceso-pagina',
  imports: [Boton, Campo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh bg-superficie lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section class="relative h-56 bg-tinta sm:h-72 lg:h-auto">
        <img
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

      <section class="flex items-center justify-center px-6 py-12 lg:px-10">
        <form class="w-full max-w-sm" (submit)="entrar($event)">
          <img
            src="fronzenlogo.png"
            alt="Frozen Paletas"
            width="486"
            height="168"
            class="h-14 w-auto"
          />

          <span class="mt-5 flex h-1 w-28 overflow-hidden rounded-full" aria-hidden="true">
            <span class="flex-1 bg-helado"></span>
            <span class="flex-1 bg-granate"></span>
            <span class="flex-1 bg-helado-hondo"></span>
          </span>

          <h1 class="titulo pt-7 text-2xl">Entrar</h1>
          <p class="pt-1 pb-7 text-sm text-tenue">Usa el correo con el que te dieron de alta.</p>

          <div class="space-y-4">
            <fz-campo etiqueta="Correo" tipo="email" autocompletado="username" [(valor)]="correo" />
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

          <div class="pt-7">
            <fz-boton tipo="submit" [ocupado]="enviando()" [ancho]="true">Entrar</fz-boton>
          </div>

          <p class="pt-6 text-xs text-tenue">
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

  protected readonly correo = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly enviando = signal(false);

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
    } finally {
      this.enviando.set(false);
    }
  }
}
