import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ESTADOS_PRODUCCION, TIPOS_SALIDA } from '../nucleo/etiquetas';
import { fechaCorta } from '../nucleo/formato';
import { Panel } from '../nucleo/modelos';
import { PanelService } from '../nucleo/panel.service';
import { SesionService } from '../nucleo/sesion.service';
import { Cargador } from '../ui/cargador';
import { Paleta } from '../ui/paleta';

@Component({
  selector: 'fz-panel-pagina',
  imports: [Cargador, Paleta, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Hola, {{ sesion.nombreCorto() }}</h1>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else if (panel(); as datos) {
      <p class="cifra pt-6 text-6xl text-tinta lg:text-7xl">
        {{ datos.stockTotal.toLocaleString('es-PE') }}
      </p>
      <p class="pt-1 text-tenue">paletas disponibles ahora mismo</p>

      <p class="pt-4 text-sm">
        @if (datos.aReponer.length > 0) {
          <a routerLink="/inventario" class="text-aguaje underline underline-offset-4"
            >{{ datos.aReponer.length }} sabores piden reposición</a
          >
        } @else {
          <span class="text-hoja">Ningún sabor llegó al mínimo</span>
        }
        @if (datos.pendientesDeEmbolsar > 0) {
          <span class="text-tenue"> y </span>
          <a routerLink="/produccion" class="text-helado-hondo underline underline-offset-4"
            >{{ datos.pendientesDeEmbolsar }} producciones esperan su conteo</a
          >
        }
      </p>

      <section class="pt-10">
        <h2 class="titulo text-lg">Stock por sabor</h2>
        <p class="pb-5 text-sm text-tenue">
          La línea punteada marca el stock mínimo de cada sabor.
        </p>

        <div class="lamina overflow-x-auto p-6">
          <div class="flex gap-7">
            @for (sabor of datos.sabores; track sabor.saborId) {
              <fz-paleta [sabor]="sabor" />
            } @empty {
              <p class="text-sm text-tenue">Todavía no hay sabores activos en el catálogo.</p>
            }
          </div>
        </div>
      </section>

      <section
        class="lamina mt-10 grid divide-y divide-linea lg:grid-cols-3 lg:divide-x lg:divide-y-0"
      >
        <article class="p-6">
          <h2 class="titulo text-base">Últimas producciones</h2>
          <ul class="pt-3">
            @for (produccion of datos.produccionesRecientes; track produccion.id) {
              <li class="flex items-baseline justify-between gap-3 border-t border-linea py-2.5">
                <span class="min-w-0">
                  <span class="block truncate text-sm">{{ produccion.sabor }}</span>
                  <span class="flex items-baseline gap-2 text-xs text-tenue">
                    <span>{{ fechaCorta(produccion.fecha) }}</span>
                    <span>{{ ESTADOS_PRODUCCION[produccion.estado] }}</span>
                  </span>
                </span>
                <span class="cifra shrink-0 text-sm">{{
                  produccion.cantidadEmbolsada ?? produccion.cantidadObtenida
                }}</span>
              </li>
            } @empty {
              <li class="border-t border-linea py-3 text-sm text-tenue">
                Sin producciones registradas.
              </li>
            }
          </ul>
        </article>

        <article class="p-6">
          <h2 class="titulo text-base">Últimas salidas</h2>
          <ul class="pt-3">
            @for (salida of datos.salidasRecientes; track salida.id) {
              <li class="flex items-baseline justify-between gap-3 border-t border-linea py-2.5">
                <span class="min-w-0">
                  <span class="block truncate text-sm">{{
                    salida.destino ?? TIPOS_SALIDA[salida.tipo]
                  }}</span>
                  <span class="flex items-baseline gap-2 text-xs text-tenue">
                    <span>{{ fechaCorta(salida.fecha) }}</span>
                    <span>{{ TIPOS_SALIDA[salida.tipo] }}</span>
                  </span>
                </span>
                <span class="cifra shrink-0 text-sm text-aguaje">−{{ salida.cantidadTotal }}</span>
              </li>
            } @empty {
              <li class="border-t border-linea py-3 text-sm text-tenue">
                Sin salidas registradas.
              </li>
            }
          </ul>
        </article>

        <article class="p-6">
          <h2 class="titulo text-base">Últimas mermas</h2>
          <ul class="pt-3">
            @for (merma of datos.mermasRecientes; track merma.id) {
              <li class="flex items-baseline justify-between gap-3 border-t border-linea py-2.5">
                <span class="min-w-0">
                  <span class="block truncate text-sm">{{ merma.sabor }}</span>
                  <span class="flex items-baseline gap-2 text-xs text-tenue">
                    <span>{{ fechaCorta(merma.fecha) }}</span>
                    <span>{{ merma.causa }}</span>
                  </span>
                </span>
                <span class="cifra shrink-0 text-sm text-granate">−{{ merma.cantidad }}</span>
              </li>
            } @empty {
              <li class="border-t border-linea py-3 text-sm text-tenue">Sin mermas registradas.</li>
            }
          </ul>
        </article>
      </section>
    }
  `,
})
export class PanelPagina {
  private readonly panelService = inject(PanelService);
  private readonly avisos = inject(AvisosService);

  protected readonly sesion = inject(SesionService);
  protected readonly panel = signal<Panel | null>(null);
  protected readonly cargando = signal(true);

  protected readonly fechaCorta = fechaCorta;
  protected readonly ESTADOS_PRODUCCION = ESTADOS_PRODUCCION;
  protected readonly TIPOS_SALIDA = TIPOS_SALIDA;

  constructor() {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      this.panel.set(await this.panelService.resumen());
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
