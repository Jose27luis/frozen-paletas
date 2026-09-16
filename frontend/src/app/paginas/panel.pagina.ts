import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ESTADOS_PRODUCCION, TIPOS_SALIDA } from '../nucleo/etiquetas';
import { fechaCorta, haceDias, hoyEnIso, miles } from '../nucleo/formato';
import { Indicadores, IndicadorSabor } from '../nucleo/indicadores';
import { Panel } from '../nucleo/modelos';
import { TONO_DEL_STOCK } from '../nucleo/estados';
import { PanelService } from '../nucleo/panel.service';
import { SesionService } from '../nucleo/sesion.service';
import { Barras, FilaBarra } from '../ui/barras';
import { Cargador } from '../ui/cargador';
import { Kpi } from '../ui/kpi';

type Metrica = 'stock' | 'producido' | 'salido' | 'merma' | 'cobertura';

interface Vista {
  titulo: string;
  pie: string;
  vacio: string;
}

const VISTAS: Readonly<Record<Metrica, Vista>> = {
  stock: {
    titulo: 'Paletas disponibles por sabor',
    pie: 'Ordenado de menos a más. La marca vertical es el stock mínimo de cada sabor.',
    vacio: 'Todavía no hay stock registrado.',
  },
  producido: {
    titulo: 'Paletas que entraron al stock',
    pie: 'Solo cuenta lo que pasó por el conteo del embolsado.',
    vacio: 'No se registró producción en el periodo.',
  },
  salido: {
    titulo: 'Paletas que salieron',
    pie: 'Suma de puntos de venta, mayoristas, delivery, ferias y otras salidas.',
    vacio: 'No se registraron salidas en el periodo.',
  },
  merma: {
    titulo: 'Paletas perdidas',
    pie: 'Incluye lo perdido en producción, en embolsado y ya en almacén.',
    vacio: 'No se registraron mermas en el periodo.',
  },
  cobertura: {
    titulo: 'Días que aguanta cada sabor',
    pie: 'Al ritmo de salida del periodo. Los primeros son los que se acaban antes.',
    vacio: 'Sin salidas en el periodo no se puede calcular la cobertura.',
  },
};

const PERIODOS = [7, 30, 90] as const;

@Component({
  selector: 'fz-panel-pagina',
  imports: [Barras, Cargador, Kpi, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="titulo text-2xl">Hola, {{ sesion.nombreCorto() }}</h1>
        @if (indicadores(); as datos) {
          <p class="pt-1 text-sm text-tenue">
            Del {{ fechaCorta(datos.desde) }} al {{ fechaCorta(datos.hasta) }}
          </p>
        }
      </div>

      <div
        class="flex rounded-full border border-linea bg-superficie p-1"
        role="group"
        aria-label="Periodo de análisis"
      >
        @for (dias of PERIODOS; track dias) {
          <button
            type="button"
            [attr.aria-pressed]="periodo() === dias"
            class="rounded-full px-4 py-1.5 text-sm transition-colors"
            [class]="
              periodo() === dias ? 'bg-helado-hondo text-superficie' : 'text-tenue hover:text-tinta'
            "
            (click)="cambiarPeriodo(dias)"
          >
            {{ dias }} días
          </button>
        }
      </div>
    </div>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado-hondo"><fz-cargador /></div>
    } @else if (indicadores(); as datos) {
      <section class="grid gap-3 pt-7 sm:grid-cols-2 xl:grid-cols-5">
        <fz-kpi
          etiqueta="Stock disponible"
          [valor]="miles(datos.stock.total)"
          [apunte]="apunteStock()"
          [activo]="metrica() === 'stock'"
          (elegido)="elegir('stock')"
        />
        <fz-kpi
          etiqueta="Producción"
          [valor]="miles(datos.produccion.embolsado)"
          [apunte]="apunteProduccion()"
          [activo]="metrica() === 'producido'"
          (elegido)="elegir('producido')"
        />
        <fz-kpi
          etiqueta="Salidas"
          [valor]="miles(datos.salidas)"
          [apunte]="apunteSalidas()"
          [activo]="metrica() === 'salido'"
          (elegido)="elegir('salido')"
        />
        <fz-kpi
          etiqueta="Merma"
          [valor]="miles(datos.mermas.total)"
          [apunte]="apunteMerma()"
          [activo]="metrica() === 'merma'"
          (elegido)="elegir('merma')"
        />
        <fz-kpi
          etiqueta="Cobertura"
          [valor]="apunteCoberturaValor()"
          [apunte]="apunteCobertura()"
          [activo]="metrica() === 'cobertura'"
          (elegido)="elegir('cobertura')"
        />
      </section>

      <section class="lamina mt-8 p-6">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="titulo text-lg">{{ vista().titulo }}</h2>
          @if (reponer() > 0) {
            <a routerLink="/inventario" class="text-sm text-aguaje underline underline-offset-4"
              >{{ reponer() }} sabores piden reposición</a
            >
          }
        </div>
        <p class="pb-5 text-sm text-tenue">{{ vista().pie }}</p>

        <fz-barras [datos]="filas()" [vacio]="vista().vacio" />
      </section>

      <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <section class="lamina p-6">
          <h2 class="titulo text-lg">Salidas por canal</h2>
          <p class="pb-5 text-sm text-tenue">A dónde fue el producto en el periodo.</p>
          <fz-barras [datos]="canales()" vacio="No se registraron salidas en el periodo." />
        </section>

        <section class="lamina grid divide-y divide-linea sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <article class="p-5">
            <h2 class="titulo text-base">Producciones</h2>
            <ul class="pt-3">
              @for (produccion of panel()?.produccionesRecientes ?? []; track produccion.id) {
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

          <article class="p-5">
            <h2 class="titulo text-base">Salidas</h2>
            <ul class="pt-3">
              @for (salida of panel()?.salidasRecientes ?? []; track salida.id) {
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
                  <span class="cifra shrink-0 text-sm text-aguaje"
                    >−{{ salida.cantidadTotal }}</span
                  >
                </li>
              } @empty {
                <li class="border-t border-linea py-3 text-sm text-tenue">
                  Sin salidas registradas.
                </li>
              }
            </ul>
          </article>

          <article class="p-5">
            <h2 class="titulo text-base">Mermas</h2>
            <ul class="pt-3">
              @for (merma of panel()?.mermasRecientes ?? []; track merma.id) {
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
                <li class="border-t border-linea py-3 text-sm text-tenue">
                  Sin mermas registradas.
                </li>
              }
            </ul>
          </article>
        </section>
      </div>
    }
  `,
})
export class PanelPagina {
  private readonly panelService = inject(PanelService);
  private readonly avisos = inject(AvisosService);

  protected readonly sesion = inject(SesionService);
  protected readonly panel = signal<Panel | null>(null);
  protected readonly indicadores = signal<Indicadores | null>(null);
  protected readonly cargando = signal(true);
  protected readonly periodo = signal<number>(30);
  protected readonly metrica = signal<Metrica>('stock');

  protected readonly PERIODOS = PERIODOS;
  protected readonly ESTADOS_PRODUCCION = ESTADOS_PRODUCCION;
  protected readonly TIPOS_SALIDA = TIPOS_SALIDA;
  protected readonly fechaCorta = fechaCorta;
  protected readonly miles = miles;

  protected readonly vista = computed(() => VISTAS[this.metrica()]);

  protected readonly reponer = computed(
    () => this.indicadores()?.sabores.filter((sabor) => sabor.estado !== 'DISPONIBLE').length ?? 0,
  );

  protected readonly filas = computed<FilaBarra[]>(() => {
    const sabores = this.indicadores()?.sabores ?? [];
    const metrica = this.metrica();

    if (metrica === 'cobertura') {
      return sabores
        .filter((sabor) => sabor.cobertura !== null)
        .sort((uno, otro) => (uno.cobertura ?? 0) - (otro.cobertura ?? 0))
        .map((sabor) => ({
          id: sabor.saborId,
          etiqueta: sabor.nombre,
          detalle: `${sabor.cobertura ?? 0} días con ${sabor.stock} paletas`,
          valor: sabor.cobertura ?? 0,
          tono: 'marino',
        }));
    }

    if (metrica === 'stock') {
      return [...sabores]
        .sort((uno, otro) => uno.stock - otro.stock)
        .map((sabor) => ({
          id: sabor.saborId,
          etiqueta: sabor.nombre,
          detalle: `${sabor.stock} paletas, mínimo ${sabor.stockMinimo}`,
          valor: sabor.stock,
          referencia: sabor.stockMinimo,
          tono: TONO_DEL_STOCK[sabor.estado],
        }));
    }

    return [...sabores]
      .sort((uno, otro) => this.valorDe(otro, metrica) - this.valorDe(uno, metrica))
      .map((sabor) => ({
        id: sabor.saborId,
        etiqueta: sabor.nombre,
        detalle: `${this.valorDe(sabor, metrica)} paletas en el periodo`,
        valor: this.valorDe(sabor, metrica),
        tono: metrica === 'merma' ? 'granate' : 'marino',
      }));
  });

  protected readonly canales = computed<FilaBarra[]>(
    () =>
      this.indicadores()?.salidasPorCanal.map((canal) => ({
        id: canal.tipo,
        etiqueta: TIPOS_SALIDA[canal.tipo],
        detalle: `${canal.cantidad} paletas`,
        valor: canal.cantidad,
        tono: 'marino',
      })) ?? [],
  );

  protected readonly apunteStock = computed(() => {
    const reponer = this.reponer();

    return reponer === 0 ? 'Ningún sabor en el mínimo' : `${reponer} sabores piden reposición`;
  });

  protected readonly apunteProduccion = computed(() => {
    const datos = this.indicadores();

    if (datos === null || datos.produccion.obtenido === 0) {
      return 'Sin producción en el periodo';
    }

    return `${datos.produccion.rendimiento}% de las ${miles(datos.produccion.obtenido)} obtenidas`;
  });

  protected readonly apunteSalidas = computed(() => {
    const canal = this.indicadores()?.salidasPorCanal[0];

    return canal === undefined
      ? 'Sin salidas en el periodo'
      : `${TIPOS_SALIDA[canal.tipo]} es el canal más fuerte`;
  });

  protected readonly apunteMerma = computed(() => {
    const datos = this.indicadores();

    if (datos === null) {
      return '';
    }

    return `${datos.mermas.porcentaje}% de lo producido`;
  });

  protected readonly apunteCoberturaValor = computed(() => {
    const cobertura = this.indicadores()?.stock.cobertura;

    return cobertura === null || cobertura === undefined ? 'Sin dato' : `${cobertura} días`;
  });

  protected readonly apunteCobertura = computed(() => {
    const datos = this.indicadores();

    if (datos === null || datos.salidas === 0) {
      return 'Hacen falta salidas para calcularla';
    }

    return `Al ritmo de los últimos ${datos.dias} días`;
  });

  constructor() {
    void this.cargar();
  }

  protected elegir(metrica: Metrica): void {
    this.metrica.set(metrica);
  }

  protected cambiarPeriodo(dias: number): void {
    this.periodo.set(dias);
    void this.cargarIndicadores();
  }

  private valorDe(sabor: IndicadorSabor, metrica: Metrica): number {
    if (metrica === 'producido') {
      return sabor.producido;
    }

    return metrica === 'salido' ? sabor.salido : sabor.merma;
  }

  private async cargar(): Promise<void> {
    try {
      const [panel, indicadores] = await Promise.all([
        this.panelService.resumen(),
        this.panelService.indicadores(haceDias(this.periodo()), hoyEnIso()),
      ]);

      this.panel.set(panel);
      this.indicadores.set(indicadores);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarIndicadores(): Promise<void> {
    try {
      this.indicadores.set(
        await this.panelService.indicadores(haceDias(this.periodo()), hoyEnIso()),
      );
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }
}
