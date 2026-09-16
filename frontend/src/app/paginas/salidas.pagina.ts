import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { DestinosService } from '../nucleo/destinos.service';
import { mensajeDe } from '../nucleo/errores';
import { PERMISOS, TIPOS_SALIDA } from '../nucleo/etiquetas';
import { fechaCorta, hoyEnIso, miles, soles } from '../nucleo/formato';
import { InventarioService } from '../nucleo/inventario.service';
import { LotesService } from '../nucleo/lotes.service';
import { Destino, Lote, Salida, StockSabor, TipoSalida } from '../nucleo/modelos';
import { SalidasService } from '../nucleo/salidas.service';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';

interface Linea {
  saborId: string;
  cantidad: number | null;
  loteId: string;
}

const TIPOS_CON_DESTINO: readonly TipoSalida[] = ['PDV', 'MAYORISTA', 'DELIVERY', 'FERIA'];

const PEDIDO_MINIMO_DELIVERY = 12;
const PRECIO_DELIVERY = 5;

const OPCIONES_TIPO: readonly Opcion[] = (Object.keys(TIPOS_SALIDA) as TipoSalida[]).map(
  (tipo) => ({ valor: tipo, texto: TIPOS_SALIDA[tipo] }),
);

function lineaVacia(): Linea {
  return { saborId: '', cantidad: null, loteId: '' };
}

@Component({
  selector: 'fz-salidas-pagina',
  imports: [Boton, Campo, CampoNumero, CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Salidas</h1>
    <p class="pt-1 text-sm text-tenue">
      Sin lote elegido, el descuento sale del lote más antiguo con stock.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado-hondo"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-7 lg:grid-cols-[25rem_1fr]">
        @if (puedeRegistrar()) {
          <form class="lamina h-fit p-6" (submit)="registrar($event)">
            <h2 class="titulo text-base">Registrar salida</h2>
            <p class="pt-1 pb-5 text-sm text-tenue">{{ reglaDelTipo() }}</p>

            <div class="space-y-4">
              <fz-campo-seleccion
                etiqueta="Tipo de salida"
                [opciones]="OPCIONES_TIPO"
                [valor]="tipo()"
                (valorChange)="cambiarTipo($event)"
              />

              @if (pideDestino()) {
                <fz-campo-seleccion
                  etiqueta="Destino"
                  vacio="Sin destino registrado"
                  [opciones]="opcionesDeDestino()"
                  [(valor)]="destinoId"
                />

                @if (puedeAdministrarDestinos()) {
                  <button
                    type="button"
                    class="text-sm text-helado-hondo underline underline-offset-4"
                    (click)="nuevoDestino.set(!nuevoDestino())"
                  >
                    {{ nuevoDestino() ? 'Cancelar el alta' : 'Dar de alta un destino nuevo' }}
                  </button>

                  @if (nuevoDestino()) {
                    <div
                      class="space-y-3 rounded-[var(--radius-campo)] border border-linea bg-hundido/40 p-4"
                    >
                      <fz-campo etiqueta="Nombre" [(valor)]="destinoNombre" />
                      <fz-campo etiqueta="Dirección" [(valor)]="destinoDireccion" />
                      <fz-campo etiqueta="Teléfono" [(valor)]="destinoTelefono" />
                      <fz-boton
                        tono="contorno"
                        [ocupado]="creandoDestino()"
                        (click)="crearDestino()"
                        >Guardar {{ TIPOS_SALIDA[tipo()] }}</fz-boton
                      >
                    </div>
                  }
                }
              }

              @if (pideMotivo()) {
                <fz-campo
                  etiqueta="Motivo"
                  ayuda="Explica a dónde va el producto."
                  [(valor)]="motivo"
                />
              }

              <div class="grid gap-4 sm:grid-cols-2">
                <fz-campo etiqueta="Fecha" tipo="date" [(valor)]="fecha" />
                <fz-campo-numero
                  etiqueta="Precio por paleta"
                  ayuda="Déjalo vacío si no se cobra."
                  [(valor)]="precio"
                />
              </div>
            </div>

            <h3 class="titulo pt-7 text-sm">Detalle</h3>
            <div class="space-y-5 pt-3">
              @for (linea of lineas(); track $index) {
                <div class="space-y-3 border-t border-linea pt-4">
                  <fz-campo-seleccion
                    etiqueta="Sabor"
                    vacio="Elige un sabor"
                    [opciones]="opcionesDeSabor()"
                    [valor]="linea.saborId"
                    (valorChange)="cambiarSabor($index, $event)"
                  />

                  <fz-campo-numero
                    etiqueta="Cantidad"
                    [ayuda]="ayudaDeLinea(linea)"
                    [minimo]="1"
                    [valor]="linea.cantidad"
                    (valorChange)="cambiarCantidad($index, $event)"
                  />

                  @if (excede(linea)) {
                    <p class="text-sm text-granate">
                      Solo quedan {{ disponible(linea) }} paletas de ese sabor.
                    </p>
                  }

                  <fz-campo-seleccion
                    etiqueta="Lote"
                    vacio="El más antiguo con stock"
                    ayuda="Elígelo solo si despachaste otro lote."
                    [opciones]="opcionesDeLote(linea.saborId)"
                    [valor]="linea.loteId"
                    (valorChange)="cambiarLote($index, $event)"
                  />

                  @if (lineas().length > 1) {
                    <fz-boton tono="fantasma" (click)="quitarLinea($index)">Quitar sabor</fz-boton>
                  }
                </div>
              }
            </div>

            <div class="mt-5 flex items-baseline justify-between border-t border-linea pt-4">
              <span class="rotulo">Total del pedido</span>
              <span class="text-right">
                <span class="cifra block text-xl">{{ totalPaletas() }} paletas</span>
                @if (importe() > 0) {
                  <span class="text-sm text-tenue">{{ soles(importe().toFixed(2)) }}</span>
                }
              </span>
            </div>

            @if (impedimento() !== '') {
              <p class="pt-3 text-sm text-granate">{{ impedimento() }}</p>
            }

            <div class="flex flex-wrap gap-3 pt-5">
              <fz-boton tono="contorno" (click)="agregarLinea()">Añadir sabor</fz-boton>
              <fz-boton tipo="submit" [ocupado]="enviando()" [deshabilitado]="impedimento() !== ''"
                >Registrar salida</fz-boton
              >
            </div>
          </form>
        }

        <div class="min-w-0">
          <section
            class="lamina grid divide-y divide-linea sm:grid-cols-3 sm:divide-x sm:divide-y-0"
          >
            <div class="p-5">
              <span class="rotulo block">Salidas listadas</span>
              <span class="cifra block pt-1 text-2xl">{{ salidas().length }}</span>
            </div>
            <div class="p-5">
              <span class="rotulo block">Paletas despachadas</span>
              <span class="cifra block pt-1 text-2xl">{{ miles(paletasListadas()) }}</span>
            </div>
            <div class="p-5">
              <span class="rotulo block">Importe</span>
              <span class="cifra block pt-1 text-2xl">{{
                soles(importeListado().toFixed(2))
              }}</span>
            </div>
          </section>

          <div class="grid max-w-3xl gap-4 py-5 sm:grid-cols-3">
            <fz-campo-seleccion
              etiqueta="Tipo"
              vacio="Todos los tipos"
              [opciones]="OPCIONES_TIPO"
              [(valor)]="filtroTipo"
              (valorChange)="refrescar()"
            />
            <fz-campo
              etiqueta="Desde"
              tipo="date"
              [(valor)]="filtroDesde"
              (valorChange)="refrescar()"
            />
            <fz-campo
              etiqueta="Hasta"
              tipo="date"
              [(valor)]="filtroHasta"
              (valorChange)="refrescar()"
            />
          </div>

          <div class="lamina overflow-x-auto">
            <table class="w-full min-w-[42rem]">
              <thead>
                <tr>
                  <th class="encabezado-tabla">Fecha</th>
                  <th class="encabezado-tabla">Tipo</th>
                  <th class="encabezado-tabla">Destino</th>
                  <th class="encabezado-tabla">Lotes</th>
                  <th class="encabezado-tabla text-right">Paletas</th>
                  <th class="encabezado-tabla text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                @for (salida of salidas(); track salida.id) {
                  <tr class="transition-colors hover:bg-hundido/50">
                    <td class="celda text-sm whitespace-nowrap">{{ fechaCorta(salida.fecha) }}</td>
                    <td class="celda">
                      <fz-chip tono="helado">{{ TIPOS_SALIDA[salida.tipo] }}</fz-chip>
                    </td>
                    <td class="celda text-sm">{{ salida.destino ?? salida.motivo ?? '—' }}</td>
                    <td class="celda text-xs text-tenue">
                      @for (detalle of salida.detalles; track detalle.loteId) {
                        <span class="block whitespace-nowrap"
                          >{{ detalle.lote }} ({{ detalle.cantidad }})</span
                        >
                      }
                    </td>
                    <td class="celda cifra text-right text-sm">{{ salida.cantidadTotal }}</td>
                    <td class="celda text-right text-sm text-tenue">{{ soles(salida.importe) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td class="celda text-sm text-tenue" colspan="6">
                      No hay salidas con esos filtros.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }
  `,
})
export class SalidasPagina {
  private readonly salidasService = inject(SalidasService);
  private readonly inventarioService = inject(InventarioService);
  private readonly destinosService = inject(DestinosService);
  private readonly lotesService = inject(LotesService);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly salidas = signal<Salida[]>([]);
  protected readonly stock = signal<StockSabor[]>([]);
  protected readonly destinos = signal<Destino[]>([]);
  protected readonly lotes = signal<Lote[]>([]);
  protected readonly cargando = signal(true);

  protected readonly tipo = signal<TipoSalida>('PDV');
  protected readonly destinoId = signal('');
  protected readonly motivo = signal('');
  protected readonly fecha = signal(hoyEnIso());
  protected readonly precio = signal<number | null>(null);
  protected readonly lineas = signal<Linea[]>([lineaVacia()]);
  protected readonly enviando = signal(false);

  protected readonly nuevoDestino = signal(false);
  protected readonly destinoNombre = signal('');
  protected readonly destinoDireccion = signal('');
  protected readonly destinoTelefono = signal('');
  protected readonly creandoDestino = signal(false);

  protected readonly filtroTipo = signal('');
  protected readonly filtroDesde = signal('');
  protected readonly filtroHasta = signal('');

  protected readonly OPCIONES_TIPO = OPCIONES_TIPO;
  protected readonly TIPOS_SALIDA = TIPOS_SALIDA;
  protected readonly fechaCorta = fechaCorta;
  protected readonly miles = miles;
  protected readonly soles = soles;

  protected readonly puedeRegistrar = computed(() => this.sesion.puede(PERMISOS.REGISTRAR_SALIDAS));

  protected readonly puedeAdministrarDestinos = computed(() =>
    this.sesion.puede(PERMISOS.ADMINISTRAR_DESTINOS),
  );

  protected readonly pideDestino = computed(() => TIPOS_CON_DESTINO.includes(this.tipo()));

  protected readonly pideMotivo = computed(() => this.tipo() === 'OTRA' || this.destinoId() === '');

  protected readonly opcionesDeSabor = computed<Opcion[]>(() =>
    this.stock().map((sabor) => ({
      valor: sabor.saborId,
      texto: `${sabor.nombre} (${sabor.stock})`,
    })),
  );

  protected readonly opcionesDeDestino = computed<Opcion[]>(() =>
    this.destinos()
      .filter((destino) => destino.tipo === this.tipo() && destino.activo)
      .map((destino) => ({ valor: destino.id, texto: destino.nombre })),
  );

  protected readonly totalPaletas = computed(() =>
    this.lineas().reduce((suma, linea) => suma + (linea.cantidad ?? 0), 0),
  );

  protected readonly importe = computed(() => {
    const precio = this.precio() ?? (this.tipo() === 'DELIVERY' ? PRECIO_DELIVERY : 0);

    return this.totalPaletas() * precio;
  });

  protected readonly reglaDelTipo = computed(() => {
    if (this.tipo() === 'DELIVERY') {
      return `Pedido mínimo de ${PEDIDO_MINIMO_DELIVERY} paletas a S/ ${PRECIO_DELIVERY}.00, con reparto gratis en Puerto Maldonado.`;
    }

    return this.pideDestino()
      ? 'Elige a quién se despacha y qué sabores salieron.'
      : 'Explica el motivo y qué sabores salieron.';
  });

  protected readonly impedimento = computed(() => {
    const lineas = this.lineas().filter(
      (linea) => linea.saborId !== '' && (linea.cantidad ?? 0) > 0,
    );

    if (lineas.length === 0) {
      return 'Añade al menos un sabor con su cantidad.';
    }

    if (lineas.some((linea) => this.excede(linea))) {
      return 'Hay una línea que pide más paletas de las que quedan.';
    }

    if (this.tipo() === 'DELIVERY' && this.totalPaletas() < PEDIDO_MINIMO_DELIVERY) {
      return `El pedido mínimo de delivery es de ${PEDIDO_MINIMO_DELIVERY} paletas.`;
    }

    if (
      TIPOS_CON_DESTINO.includes(this.tipo()) &&
      this.tipo() !== 'DELIVERY' &&
      this.tipo() !== 'FERIA' &&
      this.destinoId() === ''
    ) {
      return 'Falta indicar el punto de venta o el cliente que recibe.';
    }

    if (this.destinoId() === '' && this.motivo().trim().length < 5) {
      return 'Sin destino registrado hay que explicar a dónde va el producto.';
    }

    return '';
  });

  protected readonly paletasListadas = computed(() =>
    this.salidas().reduce((suma, salida) => suma + salida.cantidadTotal, 0),
  );

  protected readonly importeListado = computed(() =>
    this.salidas().reduce((suma, salida) => suma + Number(salida.importe), 0),
  );

  constructor() {
    void this.cargar();
  }

  protected disponible(linea: Linea): number {
    if (linea.loteId !== '') {
      return this.lotes().find((lote) => lote.id === linea.loteId)?.stockRestante ?? 0;
    }

    return this.stock().find((sabor) => sabor.saborId === linea.saborId)?.stock ?? 0;
  }

  protected excede(linea: Linea): boolean {
    return (
      linea.saborId !== '' && linea.cantidad !== null && linea.cantidad > this.disponible(linea)
    );
  }

  protected ayudaDeLinea(linea: Linea): string {
    if (linea.saborId === '') {
      return 'Elige primero el sabor.';
    }

    return `Quedan ${this.disponible(linea)} paletas.`;
  }

  protected opcionesDeLote(saborId: string): Opcion[] {
    return this.lotes()
      .filter((lote) => lote.saborId === saborId)
      .map((lote) => ({
        valor: lote.id,
        texto: `${lote.codigo} (quedan ${lote.stockRestante})`,
      }));
  }

  protected cambiarTipo(valor: string): void {
    this.tipo.set(valor as TipoSalida);
    this.destinoId.set('');
    this.nuevoDestino.set(false);
  }

  protected cambiarSabor(indice: number, valor: string): void {
    this.actualizarLinea(indice, { saborId: valor, loteId: '' });
  }

  protected cambiarCantidad(indice: number, valor: number | null): void {
    this.actualizarLinea(indice, { cantidad: valor });
  }

  protected cambiarLote(indice: number, valor: string): void {
    this.actualizarLinea(indice, { loteId: valor });
  }

  protected agregarLinea(): void {
    this.lineas.update((lineas) => [...lineas, lineaVacia()]);
  }

  protected quitarLinea(indice: number): void {
    this.lineas.update((lineas) => lineas.filter((_, posicion) => posicion !== indice));
  }

  protected async crearDestino(): Promise<void> {
    if (this.destinoNombre().trim().length < 3) {
      this.avisos.error('Escribe el nombre del destino.');
      return;
    }

    this.creandoDestino.set(true);

    try {
      const creado = await this.destinosService.crear({
        tipo: this.tipo(),
        nombre: this.destinoNombre().trim(),
        direccion: this.destinoDireccion() === '' ? undefined : this.destinoDireccion(),
        telefono: this.destinoTelefono() === '' ? undefined : this.destinoTelefono(),
      });

      this.destinos.set(await this.destinosService.listar(undefined, true));
      this.destinoId.set(creado.id);
      this.nuevoDestino.set(false);
      this.destinoNombre.set('');
      this.destinoDireccion.set('');
      this.destinoTelefono.set('');
      this.avisos.exito(`${creado.nombre} quedó registrado.`);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.creandoDestino.set(false);
    }
  }

  protected async registrar(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.impedimento() !== '') {
      this.avisos.error(this.impedimento());
      return;
    }

    const precio = this.precio();

    const detalles = this.lineas()
      .filter((linea) => linea.saborId !== '' && (linea.cantidad ?? 0) > 0)
      .map((linea) => ({
        saborId: linea.saborId,
        cantidad: linea.cantidad ?? 0,
        loteId: linea.loteId === '' ? undefined : linea.loteId,
        precioUnitario: precio ?? undefined,
      }));

    this.enviando.set(true);

    try {
      const salida = await this.salidasService.registrar({
        tipo: this.tipo(),
        destinoId: this.destinoId() === '' ? undefined : this.destinoId(),
        motivo: this.motivo() === '' ? undefined : this.motivo(),
        fecha: this.fecha(),
        detalles,
        claveIdempotencia: crypto.randomUUID(),
      });

      this.avisos.exito(`Salieron ${salida.cantidadTotal} paletas del inventario.`);
      this.lineas.set([lineaVacia()]);
      this.motivo.set('');
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.enviando.set(false);
    }
  }

  protected async refrescar(): Promise<void> {
    try {
      const [salidas, lotes, inventario] = await Promise.all([
        this.salidasService.listar({
          tipo: this.filtroTipo() === '' ? undefined : (this.filtroTipo() as TipoSalida),
          desde: this.filtroDesde() === '' ? undefined : this.filtroDesde(),
          hasta: this.filtroHasta() === '' ? undefined : this.filtroHasta(),
          limite: 100,
        }),
        this.lotesService.listar({ conStock: true, limite: 200 }),
        this.inventarioService.resumen(),
      ]);

      this.salidas.set(salidas);
      this.lotes.set(lotes);
      this.stock.set(inventario.sabores);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private actualizarLinea(indice: number, cambios: Partial<Linea>): void {
    this.lineas.update((lineas) =>
      lineas.map((linea, posicion) => (posicion === indice ? { ...linea, ...cambios } : linea)),
    );
  }

  private async cargar(): Promise<void> {
    try {
      this.destinos.set(await this.destinosService.listar(undefined, true));
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
