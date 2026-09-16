import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { CATEGORIAS, ESTADOS_STOCK, TIPOS_MOVIMIENTO } from '../nucleo/etiquetas';
import { fechaCorta, fechaLarga, miles } from '../nucleo/formato';
import { InventarioService } from '../nucleo/inventario.service';
import { LotesService } from '../nucleo/lotes.service';
import { EstadoStock, Inventario, Lote, Movimiento, StockSabor } from '../nucleo/modelos';
import { Campo } from '../ui/campo';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip, TonoChip } from '../ui/chip';
import { Icono } from '../ui/icono';

type Orden = 'urgencia' | 'stock' | 'nombre' | 'antiguedad';

interface Detalle {
  lotes: Lote[];
  movimientos: Movimiento[];
}

const TONOS: Readonly<Record<EstadoStock, TonoChip>> = {
  DISPONIBLE: 'hoja',
  REPONER: 'aguaje',
  AGOTADO: 'granate',
};

const RELLENOS: Readonly<Record<EstadoStock, string>> = {
  DISPONIBLE: 'bg-hoja',
  REPONER: 'bg-aguaje-vivo',
  AGOTADO: 'bg-granate',
};

const URGENCIA: Readonly<Record<EstadoStock, number>> = {
  AGOTADO: 0,
  REPONER: 1,
  DISPONIBLE: 2,
};

const FILTROS: readonly { valor: string; texto: string }[] = [
  { valor: 'TODOS', texto: 'Todos' },
  { valor: 'REPONER', texto: 'Reponer' },
  { valor: 'AGOTADO', texto: 'Agotado' },
  { valor: 'DISPONIBLE', texto: 'Disponible' },
];

const ORDENES: readonly Opcion[] = [
  { valor: 'urgencia', texto: 'Los que urgen primero' },
  { valor: 'stock', texto: 'Menos stock primero' },
  { valor: 'antiguedad', texto: 'Lote más viejo primero' },
  { valor: 'nombre', texto: 'Por nombre' },
];

const TIPOS: readonly Opcion[] = [
  { valor: 'INGRESO_PRODUCCION', texto: 'Ingreso por producción' },
  { valor: 'SALIDA', texto: 'Salida' },
  { valor: 'MERMA', texto: 'Merma' },
  { valor: 'AJUSTE', texto: 'Ajuste' },
];

const ESCALA_SOBRE_MINIMO = 2;

@Component({
  selector: 'fz-inventario-pagina',
  imports: [Campo, CampoSeleccion, Cargador, Chip, Icono, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Inventario</h1>
    <p class="pt-1 text-sm text-tenue">
      Lo que hay, de qué lote sale primero y qué se movió para llegar hasta aquí.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado-hondo"><fz-cargador /></div>
    } @else if (inventario(); as datos) {
      <section
        class="lamina mt-7 grid divide-y divide-linea sm:grid-cols-4 sm:divide-x sm:divide-y-0"
      >
        <div class="p-5">
          <span class="rotulo block">Paletas disponibles</span>
          <span class="cifra block pt-1 text-2xl">{{ miles(datos.total) }}</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">Piden reposición</span>
          <span class="cifra block pt-1 text-2xl" [class.text-aguaje]="porReponer() > 0">{{
            porReponer()
          }}</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">Lotes con stock</span>
          <span class="cifra block pt-1 text-2xl">{{ lotesAbiertos() }}</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">Lote más viejo</span>
          @if (masViejo(); as viejo) {
            <span class="cifra block pt-1 text-2xl">{{ viejo.antiguedad }} d</span>
            <span class="block text-xs text-tenue">{{ viejo.codigo }}</span>
          } @else {
            <span class="block pt-1 text-sm text-tenue">Sin lotes abiertos</span>
          }
        </div>
      </section>

      <div class="flex flex-wrap items-end gap-4 pt-8">
        <div class="w-full max-w-xs">
          <fz-campo etiqueta="Buscar sabor" [(valor)]="busqueda" />
        </div>

        <div class="w-full max-w-[16rem]">
          <fz-campo-seleccion etiqueta="Orden" [opciones]="ORDENES" [(valor)]="orden" />
        </div>

        <div class="flex flex-wrap gap-1.5 pb-1" role="group" aria-label="Filtrar por estado">
          @for (filtro of FILTROS; track filtro.valor) {
            <button
              type="button"
              [attr.aria-pressed]="estado() === filtro.valor"
              class="rounded-full border px-3.5 py-1.5 text-sm transition-colors"
              [class]="
                estado() === filtro.valor
                  ? 'border-helado-hondo bg-helado-hondo text-superficie'
                  : 'border-linea text-tenue hover:border-helado hover:text-tinta'
              "
              (click)="estado.set(filtro.valor)"
            >
              {{ filtro.texto }}
            </button>
          }
        </div>
      </div>

      <section class="pt-5">
        <ul class="space-y-2">
          @for (sabor of visibles(); track sabor.saborId) {
            <li class="lamina overflow-hidden">
              <button
                type="button"
                class="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-hundido/50"
                [attr.aria-expanded]="abierto() === sabor.saborId"
                (click)="alternar(sabor)"
              >
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span class="text-sm text-tinta">{{ sabor.nombre }}</span>
                    <span class="text-xs text-tenue">{{ CATEGORIAS[sabor.categoria] }}</span>
                  </span>

                  <span class="mt-2 block h-2.5 max-w-sm rounded-full bg-hundido">
                    <span class="relative block h-full">
                      <span
                        class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
                        [class]="RELLENOS[sabor.estado]"
                        [style.width.%]="ancho(sabor)"
                      ></span>
                      <span
                        class="absolute -inset-y-1 w-0.5 rounded-full bg-tinta/55"
                        [style.left.%]="marca()"
                      ></span>
                    </span>
                  </span>

                  <span class="flex flex-wrap items-baseline gap-x-3 pt-2 text-xs text-tenue">
                    <span>mínimo {{ sabor.stockMinimo }}</span>
                    <span>{{ sabor.lotesAbiertos }} lotes con stock</span>
                    @if (sabor.loteMasAntiguo; as viejo) {
                      <span>el más viejo lleva {{ viejo.antiguedad }} días</span>
                    }
                  </span>
                </span>

                <span class="shrink-0 text-right">
                  <span class="cifra block text-2xl">{{ miles(sabor.stock) }}</span>
                  <fz-chip [tono]="TONOS[sabor.estado]">{{ ESTADOS_STOCK[sabor.estado] }}</fz-chip>
                </span>

                <span
                  class="shrink-0 text-tenue transition-transform duration-300"
                  [class.rotate-90]="abierto() === sabor.saborId"
                  aria-hidden="true"
                >
                  <fz-icono nombre="desplegar" />
                </span>
              </button>

              <div
                class="grid transition-[grid-template-rows] duration-300 ease-out"
                [class]="abierto() === sabor.saborId ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
              >
                <div class="overflow-hidden">
                  <div class="border-t border-linea p-4">
                    @if (detalle(); as datos) {
                      <div class="grid gap-6 lg:grid-cols-2">
                        <div>
                          <h3 class="titulo text-sm">Lotes con stock</h3>
                          <p class="pb-2 text-xs text-tenue">
                            El primero de la lista es el que sale por PEPS.
                          </p>
                          <ul>
                            @for (lote of datos.lotes; track lote.id) {
                              <li
                                class="flex items-baseline justify-between gap-3 border-t border-linea py-2"
                              >
                                <span>
                                  <span class="block text-sm">{{ lote.codigo }}</span>
                                  <span class="text-xs text-tenue">{{
                                    fechaLarga(lote.fechaProduccion)
                                  }}</span>
                                </span>
                                <span class="cifra text-sm">{{ lote.stockRestante }}</span>
                              </li>
                            } @empty {
                              <li class="border-t border-linea py-2 text-sm text-tenue">
                                Este sabor no tiene lotes con stock.
                              </li>
                            }
                          </ul>
                        </div>

                        <div>
                          <h3 class="titulo text-sm">Últimos movimientos</h3>
                          <p class="pb-2 text-xs text-tenue">Lo que sumó y restó a este sabor.</p>
                          <ul>
                            @for (movimiento of datos.movimientos; track movimiento.id) {
                              <li
                                class="flex items-baseline justify-between gap-3 border-t border-linea py-2"
                              >
                                <span class="min-w-0">
                                  <span class="block truncate text-sm">{{
                                    TIPOS_MOVIMIENTO[movimiento.tipo]
                                  }}</span>
                                  <span class="flex items-baseline gap-2 text-xs text-tenue">
                                    <span>{{ fechaCorta(movimiento.fecha) }}</span>
                                    <span>{{ movimiento.lote ?? 'Sin lote' }}</span>
                                  </span>
                                </span>
                                <span
                                  class="cifra shrink-0 text-sm"
                                  [class.text-hoja]="movimiento.cantidad > 0"
                                  [class.text-granate]="movimiento.cantidad < 0"
                                  >{{ movimiento.cantidad > 0 ? '+' : ''
                                  }}{{ movimiento.cantidad }}</span
                                >
                              </li>
                            } @empty {
                              <li class="border-t border-linea py-2 text-sm text-tenue">
                                Todavía no hay movimientos de este sabor.
                              </li>
                            }
                          </ul>
                        </div>
                      </div>

                      <div class="flex flex-wrap gap-4 pt-5 text-sm">
                        <a
                          routerLink="/produccion"
                          class="text-helado-hondo underline underline-offset-4"
                          >Registrar producción</a
                        >
                        <a
                          routerLink="/salidas"
                          class="text-helado-hondo underline underline-offset-4"
                          >Registrar salida</a
                        >
                        <a
                          routerLink="/lotes"
                          class="text-helado-hondo underline underline-offset-4"
                          >Ver todos los lotes</a
                        >
                      </div>
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
            <li class="lamina p-8 text-center text-sm text-tenue">
              Ningún sabor coincide con la búsqueda.
            </li>
          }
        </ul>
      </section>

      <section class="pt-12">
        <h2 class="titulo text-lg">Historial de movimientos</h2>
        <p class="pb-5 text-sm text-tenue">
          Cada fila es una entrada o una salida del libro de inventario.
        </p>

        <div class="grid max-w-3xl gap-4 pb-5 sm:grid-cols-3">
          <fz-campo-seleccion
            etiqueta="Tipo"
            vacio="Todos los tipos"
            [opciones]="TIPOS"
            [(valor)]="tipo"
            (valorChange)="cargarMovimientos()"
          />
          <fz-campo
            etiqueta="Desde"
            tipo="date"
            [(valor)]="desde"
            (valorChange)="cargarMovimientos()"
          />
          <fz-campo
            etiqueta="Hasta"
            tipo="date"
            [(valor)]="hasta"
            (valorChange)="cargarMovimientos()"
          />
        </div>

        <div class="lamina overflow-x-auto">
          <table class="w-full min-w-[40rem]">
            <thead>
              <tr>
                <th class="encabezado-tabla">Fecha</th>
                <th class="encabezado-tabla">Tipo</th>
                <th class="encabezado-tabla">Sabor</th>
                <th class="encabezado-tabla">Lote</th>
                <th class="encabezado-tabla text-right">Cantidad</th>
                <th class="encabezado-tabla">Quién</th>
              </tr>
            </thead>
            <tbody>
              @for (movimiento of movimientos(); track movimiento.id) {
                <tr class="transition-colors hover:bg-hundido/50">
                  <td class="celda text-sm whitespace-nowrap">
                    {{ fechaCorta(movimiento.fecha) }}
                  </td>
                  <td class="celda text-sm">{{ TIPOS_MOVIMIENTO[movimiento.tipo] }}</td>
                  <td class="celda text-sm">{{ movimiento.sabor }}</td>
                  <td class="celda text-sm text-tenue">{{ movimiento.lote ?? 'Sin lote' }}</td>
                  <td
                    class="celda cifra text-right text-sm"
                    [class.text-hoja]="movimiento.cantidad > 0"
                    [class.text-granate]="movimiento.cantidad < 0"
                  >
                    {{ movimiento.cantidad > 0 ? '+' : '' }}{{ movimiento.cantidad }}
                  </td>
                  <td class="celda text-sm text-tenue">{{ movimiento.usuario }}</td>
                </tr>
              } @empty {
                <tr>
                  <td class="celda text-sm text-tenue" colspan="6">
                    No hay movimientos con esos filtros.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
})
export class InventarioPagina {
  private readonly inventarioService = inject(InventarioService);
  private readonly lotesService = inject(LotesService);
  private readonly avisos = inject(AvisosService);

  protected readonly inventario = signal<Inventario | null>(null);
  protected readonly movimientos = signal<Movimiento[]>([]);
  protected readonly cargando = signal(true);

  protected readonly busqueda = signal('');
  protected readonly estado = signal('TODOS');
  protected readonly orden = signal<string>('urgencia');
  protected readonly tipo = signal('');
  protected readonly desde = signal('');
  protected readonly hasta = signal('');

  protected readonly abierto = signal<string | null>(null);
  protected readonly detalle = signal<Detalle | null>(null);

  protected readonly CATEGORIAS = CATEGORIAS;
  protected readonly ESTADOS_STOCK = ESTADOS_STOCK;
  protected readonly TIPOS_MOVIMIENTO = TIPOS_MOVIMIENTO;
  protected readonly TONOS = TONOS;
  protected readonly RELLENOS = RELLENOS;
  protected readonly FILTROS = FILTROS;
  protected readonly ORDENES = ORDENES;
  protected readonly TIPOS = TIPOS;
  protected readonly fechaCorta = fechaCorta;
  protected readonly fechaLarga = fechaLarga;
  protected readonly miles = miles;

  protected readonly porReponer = computed(
    () => this.inventario()?.sabores.filter((sabor) => sabor.estado !== 'DISPONIBLE').length ?? 0,
  );

  protected readonly lotesAbiertos = computed(
    () => this.inventario()?.sabores.reduce((suma, sabor) => suma + sabor.lotesAbiertos, 0) ?? 0,
  );

  protected readonly masViejo = computed(() => {
    const lotes = (this.inventario()?.sabores ?? [])
      .map((sabor) => sabor.loteMasAntiguo)
      .filter((lote) => lote !== null);

    return lotes.sort((uno, otro) => otro.antiguedad - uno.antiguedad)[0] ?? null;
  });

  protected readonly visibles = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const estado = this.estado();
    const orden = this.orden() as Orden;

    const filtrados = (this.inventario()?.sabores ?? []).filter((sabor) => {
      const coincide =
        texto === '' ||
        sabor.nombre.toLowerCase().includes(texto) ||
        sabor.abreviatura.toLowerCase().includes(texto);

      return coincide && (estado === 'TODOS' || sabor.estado === estado);
    });

    return [...filtrados].sort((uno, otro) => this.comparar(uno, otro, orden));
  });

  constructor() {
    void this.cargar();
  }

  protected ancho(sabor: StockSabor): number {
    const tope = Math.max(sabor.stockMinimo, 1) * ESCALA_SOBRE_MINIMO;

    return Math.min(100, Math.round((sabor.stock / tope) * 100));
  }

  protected marca(): number {
    return 100 / ESCALA_SOBRE_MINIMO;
  }

  protected alternar(sabor: StockSabor): void {
    if (this.abierto() === sabor.saborId) {
      this.abierto.set(null);
      return;
    }

    this.abierto.set(sabor.saborId);
    this.detalle.set(null);
    void this.cargarDetalle(sabor.saborId);
  }

  protected async cargarMovimientos(): Promise<void> {
    try {
      this.movimientos.set(
        await this.inventarioService.movimientos({
          tipo: this.tipo() === '' ? undefined : (this.tipo() as Movimiento['tipo']),
          desde: this.desde() === '' ? undefined : this.desde(),
          hasta: this.hasta() === '' ? undefined : this.hasta(),
        }),
      );
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private comparar(uno: StockSabor, otro: StockSabor, orden: Orden): number {
    if (orden === 'nombre') {
      return uno.nombre.localeCompare(otro.nombre);
    }

    if (orden === 'stock') {
      return uno.stock - otro.stock;
    }

    if (orden === 'antiguedad') {
      return (otro.loteMasAntiguo?.antiguedad ?? -1) - (uno.loteMasAntiguo?.antiguedad ?? -1);
    }

    const urgencia = URGENCIA[uno.estado] - URGENCIA[otro.estado];

    return urgencia === 0 ? uno.stock - otro.stock : urgencia;
  }

  private async cargarDetalle(saborId: string): Promise<void> {
    try {
      const [lotes, movimientos] = await Promise.all([
        this.lotesService.listar({ saborId, conStock: true, limite: 50 }),
        this.inventarioService.movimientos({ saborId, limite: 8 }),
      ]);

      if (this.abierto() === saborId) {
        this.detalle.set({ lotes, movimientos });
      }
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private async cargar(): Promise<void> {
    try {
      const [inventario, movimientos] = await Promise.all([
        this.inventarioService.resumen(),
        this.inventarioService.movimientos({}),
      ]);

      this.inventario.set(inventario);
      this.movimientos.set(movimientos);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
