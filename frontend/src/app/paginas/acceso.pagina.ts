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
    <div class="min-h-dvh lg:grid lg:grid-cols-[1.1fr_1fr]">
      <section class="flex flex-col justify-between bg-tinta px-6 py-10 text-superficie lg:px-14">
        <div>
          <span class="titulo block text-2xl">Frozen</span>
          <span class="block text-sm text-superficie/60">Paletas artesanales</span>
        </div>

        <p class="titulo max-w-sm py-12 text-3xl text-superficie lg:text-4xl">
          El recorrido de cada paleta, desde el balde hasta la puerta.
        </p>

        <p class="max-w-xs text-sm text-superficie/60">
          Producción, embolsado, stock por sabor, salidas y mermas en un solo sitio.
        </p>
      </section>

      <section class="flex items-center justify-center px-6 py-12">
        <form class="w-full max-w-sm" (submit)="entrar($event)">
          <h1 class="titulo text-2xl">Entrar</h1>
          <p class="pt-1 pb-8 text-sm text-tenue">Usa el correo con el que te dieron de alta.</p>

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

          <div class="pt-6">
            <fz-boton tipo="submit" [ocupado]="enviando()" [ancho]="true">Entrar</fz-boton>
          </div>
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
