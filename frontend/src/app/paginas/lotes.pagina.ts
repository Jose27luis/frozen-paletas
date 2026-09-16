import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ESTADOS_LOTE, TIPOS_MOVIMIENTO } from '../nucleo/etiquetas';
import { fechaCorta, fechaLarga, miles } from '../nucleo/formato';
import { InventarioService } from '../nucleo/inventario.service';
import { LotesService } from '../nucleo/lotes.service';
import { EstadoLote, Lote, Movimiento, Sabor } from '../nucleo/modelos';
import { SaboresService } from '../nucleo/sabores.service';
import { Campo } from '../ui/campo';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip, TonoChip } from '../ui/chip';
import { Icono } from '../ui/icono';

const TONOS: Readonly<Record<EstadoLote, TonoChip>> = {
  PENDIENTE: 'neutro',
  ABIERTO: 'hoja',
  PARCIAL: 'helado',
  AGOTADO: 'neutro',
};

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

@Component({
  selector: 'fz-lotes-pagina',
  imports: [Campo, CampoSeleccion, Cargador, Chip, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Lotes</h1>
    <p class="pt-1 text-sm text-tenue">
      Cada producción genera un lote. Un lote agotado sigue consultable: es la trazabilidad.
    </p>

    <section class="lamina mt-7 p-6">
      <h2 class="titulo text-base">Buscar por código</h2>
      <p class="pt-1 pb-4 text-sm text-tenue">
        Escribe el código impreso en la bolsa, tal cual, y te digo de dónde salió.
      </p>

      <form class="flex flex-wrap items-end gap-3" (submit)="buscar($event)">
        <div class="w-full max-w-xs">
          <fz-campo
            etiqueta="Código de lote"
            ayuda="Por ejemplo FRE-140926-01"
            [(valor)]="codigo"
          />
        </div>
        <button
          type="submit"
          class="h-11 rounded-[var(--radius-campo)] bg-helado-hondo px-5 text-sm font-medium text-superficie transition-colors hover:bg-tinta"
        >
          Buscar
        </button>
      </form>

      @if (buscado(); as lote) {
        <div class="mt-5 rounded-[var(--radius-campo)] border border-helado bg-helado/5 p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="cifra text-lg text-helado-hondo">{{ lote.codigo }}</p>
              <p class="pt-1 text-sm">{{ lote.sabor }}</p>
              <p class="flex flex-wrap items-baseline gap-x-3 pt-1 text-xs text-tenue">
                <span>producido el {{ fechaLarga(lote.fechaProduccion) }}</span>
                <span>hace {{ antiguedad(lote) }} días</span>
                <span>{{ lote.responsable }}</span>
              </p>
            </div>
            <div class="text-right">
              <span class="cifra block text-2xl">{{ lote.stockRestante }}</span>
              <span class="text-xs text-tenue">de {{ lote.cantidadIngresada }} que ingresaron</span>
              <span class="mt-1 block">
                <fz-chip [tono]="TONOS[lote.estado]">{{ ESTADOS_LOTE[lote.estado] }}</fz-chip>
              </span>
            </div>
          </div>
        </div>
      } @else if (sinResultado()) {
        <p class="pt-4 text-sm text-granate">No hay ningún lote con ese código.</p>
      }
    </section>

    <div class="grid max-w-3xl gap-4 pt-8 sm:grid-cols-3">
      <fz-campo-seleccion
        etiqueta="Sabor"
        vacio="Todos los sabores"
        [opciones]="opcionesDeSabor()"
        [(valor)]="saborId"
        (valorChange)="refrescar()"
      />
      <fz-campo-seleccion
        etiqueta="Estado"
        vacio="Todos los estados"
        [opciones]="OPCIONES_ESTADO"
        [(valor)]="estado"
        (valorChange)="refrescar()"
      />
      <fz-campo-seleccion
        etiqueta="Mostrar"
        [opciones]="OPCIONES_STOCK"
        [(valor)]="soloConStock"
        (valorChange)="refrescar()"
      />
    </div>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado-hondo"><fz-cargador /></div>
    } @else {
      <section
        class="lamina mt-5 grid divide-y divide-linea sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div class="p-5">
          <span class="rotulo block">Lotes listados</span>
          <span class="cifra block pt-1 text-2xl">{{ lotes().length }}</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">Paletas en esos lotes</span>
          <span class="cifra block pt-1 text-2xl">{{ miles(paletas()) }}</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">El más viejo con stock</span>
          @if (masViejo(); as viejo) {
            <span class="cifra block pt-1 text-2xl">{{ antiguedad(viejo) }} d</span>
            <span class="block text-xs text-tenue">{{ viejo.codigo }}</span>
          } @else {
            <span class="block pt-1 text-sm text-tenue">Ninguno con stock</span>
          }
        </div>
      </section>

      <ul class="mt-5 space-y-2">
        @for (lote of lotes(); track lote.id) {
          <li class="lamina overflow-hidden">
            <button
              type="button"
              class="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-hundido/50"
              [attr.aria-expanded]="abierto() === lote.id"
              (click)="alternar(lote)"
            >
              <span class="min-w-0 flex-1">
                <span class="cifra block text-base text-helado-hondo">{{ lote.codigo }}</span>
                <span class="block truncate pt-0.5 text-sm">{{ lote.sabor }}</span>
                <span class="flex flex-wrap items-baseline gap-x-3 pt-1 text-xs text-tenue">
                  <span>{{ fechaLarga(lote.fechaProduccion) }}</span>
                  <span [class.text-aguaje]="lote.stockRestante > 0 && antiguedad(lote) >= 30"
                    >hace {{ antiguedad(lote) }} días</span
                  >
                  <span>{{ lote.responsable }}</span>
                </span>
              </span>

              <span class="shrink-0 text-right">
                <span class="cifra block text-xl">{{ lote.stockRestante }}</span>
                <span class="text-xs text-tenue">de {{ lote.cantidadIngresada }}</span>
                <span class="mt-1 block">
                  <fz-chip [tono]="TONOS[lote.estado]">{{ ESTADOS_LOTE[lote.estado] }}</fz-chip>
                </span>
              </span>

              <span
                class="shrink-0 text-tenue transition-transform duration-300"
                [class.rotate-90]="abierto() === lote.id"
                aria-hidden="true"
              >
                <fz-icono nombre="desplegar" />
              </span>
            </button>

            <div
              class="grid transition-[grid-template-rows] duration-300 ease-out"
              [class]="abierto() === lote.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="overflow-hidden">
                <div class="border-t border-linea p-4">
                  <h3 class="titulo text-sm">A dónde fue este lote</h3>
                  <p class="pb-2 text-xs text-tenue">
                    Todo lo que entró y salió de estas paletas, en orden.
                  </p>

                  @if (movimientos(); as filas) {
                    <ul>
                      @for (movimiento of filas; track movimiento.id) {
                        <li
                          class="flex items-baseline justify-between gap-3 border-t border-linea py-2"
                        >
                          <span class="min-w-0">
                            <span class="block truncate text-sm">{{
                              TIPOS_MOVIMIENTO[movimiento.tipo]
                            }}</span>
                            <span class="flex items-baseline gap-2 text-xs text-tenue">
                              <span>{{ fechaCorta(movimiento.fecha) }}</span>
                              <span>{{ movimiento.usuario }}</span>
                              @if (movimiento.motivo !== null) {
                                <span>{{ movimiento.motivo }}</span>
                              }
                            </span>
                          </span>
                          <span
                            class="cifra shrink-0 text-sm"
                            [class.text-hoja]="movimiento.cantidad > 0"
                            [class.text-granate]="movimiento.cantidad < 0"
                            >{{ movimiento.cantidad > 0 ? '+' : '' }}{{ movimiento.cantidad }}</span
                          >
                        </li>
                      } @empty {
                        <li class="border-t border-linea py-2 text-sm text-tenue">
                          Este lote todavía no tiene movimientos.
                        </li>
                      }
                    </ul>
                  } @else {
                    <div class="flex justify-center py-6 text-helado-hondo">
                      <fz-cargador tamano="sm" />
                    </div>
                  }
                </div>
              </div>
            </div>
          </li>
        } @empty {
          <li class="lamina p-8 text-center text-sm text-tenue">No hay lotes con esos filtros.</li>
        }
      </ul>
    }
  `,
})
export class LotesPagina {
  private readonly lotesService = inject(LotesService);
  private readonly saboresService = inject(SaboresService);
  private readonly inventarioService = inject(InventarioService);
  private readonly avisos = inject(AvisosService);

  protected readonly lotes = signal<Lote[]>([]);
  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly cargando = signal(true);

  protected readonly saborId = signal('');
  protected readonly estado = signal('');
  protected readonly soloConStock = signal('con-stock');

  protected readonly codigo = signal('');
  protected readonly buscado = signal<Lote | null>(null);
  protected readonly sinResultado = signal(false);

  protected readonly abierto = signal<string | null>(null);
  protected readonly movimientos = signal<Movimiento[] | null>(null);

  protected readonly ESTADOS_LOTE = ESTADOS_LOTE;
  protected readonly TIPOS_MOVIMIENTO = TIPOS_MOVIMIENTO;
  protected readonly TONOS = TONOS;
  protected readonly fechaCorta = fechaCorta;
  protected readonly fechaLarga = fechaLarga;
  protected readonly miles = miles;

  protected readonly OPCIONES_ESTADO: readonly Opcion[] = (
    Object.keys(ESTADOS_LOTE) as EstadoLote[]
  ).map((estado) => ({ valor: estado, texto: ESTADOS_LOTE[estado] }));

  protected readonly OPCIONES_STOCK: readonly Opcion[] = [
    { valor: 'con-stock', texto: 'Solo los que tienen paletas' },
    { valor: 'todos', texto: 'Todos, incluidos los agotados' },
  ];

  protected readonly opcionesDeSabor = computed<Opcion[]>(() =>
    this.sabores().map((sabor) => ({ valor: sabor.id, texto: sabor.nombre })),
  );

  protected readonly paletas = computed(() =>
    this.lotes().reduce((suma, lote) => suma + lote.stockRestante, 0),
  );

  protected readonly masViejo = computed(
    () => this.lotes().filter((lote) => lote.stockRestante > 0)[0] ?? null,
  );

  constructor() {
    void this.cargar();
  }

  protected antiguedad(lote: Lote): number {
    const fecha = new Date(`${lote.fechaProduccion.slice(0, 10)}T00:00:00.000Z`).getTime();

    return Math.max(0, Math.round((Date.now() - fecha) / MILISEGUNDOS_POR_DIA));
  }

  protected async buscar(evento: Event): Promise<void> {
    evento.preventDefault();

    const codigo = this.codigo().trim().toUpperCase();

    if (codigo === '') {
      return;
    }

    this.buscado.set(null);
    this.sinResultado.set(false);

    try {
      this.buscado.set(await this.lotesService.porCodigo(codigo));
    } catch {
      this.sinResultado.set(true);
    }
  }

  protected alternar(lote: Lote): void {
    if (this.abierto() === lote.id) {
      this.abierto.set(null);
      return;
    }

    this.abierto.set(lote.id);
    this.movimientos.set(null);
    void this.cargarMovimientos(lote.id);
  }

  protected async refrescar(): Promise<void> {
    try {
      this.lotes.set(
        await this.lotesService.listar({
          saborId: this.saborId() === '' ? undefined : this.saborId(),
          estado: this.estado() === '' ? undefined : (this.estado() as EstadoLote),
          conStock: this.soloConStock() === 'con-stock' ? true : undefined,
          limite: 200,
        }),
      );
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private async cargarMovimientos(loteId: string): Promise<void> {
    try {
      const movimientos = await this.inventarioService.movimientos({ loteId, limite: 50 });

      if (this.abierto() === loteId) {
        this.movimientos.set(movimientos);
      }
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.sabores.set(await this.saboresService.listar());
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
