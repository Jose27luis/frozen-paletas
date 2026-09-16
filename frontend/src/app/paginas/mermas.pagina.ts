import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ORIGENES_MERMA, PERMISOS } from '../nucleo/etiquetas';
import { fechaCorta, haceDias, hoyEnIso, miles } from '../nucleo/formato';
import { InventarioService } from '../nucleo/inventario.service';
import { LotesService } from '../nucleo/lotes.service';
import { MermasService, ResumenMermas } from '../nucleo/mermas.service';
import { CausaMerma, Lote, Merma, OrigenMerma, StockSabor } from '../nucleo/modelos';
import { SesionService } from '../nucleo/sesion.service';
import { Barras, FilaBarra } from '../ui/barras';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';

const PERIODOS = [7, 30, 90] as const;

const OPCIONES_ORIGEN: readonly Opcion[] = (Object.keys(ORIGENES_MERMA) as OrigenMerma[]).map(
  (origen) => ({ valor: origen, texto: ORIGENES_MERMA[origen] }),
);

@Component({
  selector: 'fz-mermas-pagina',
  imports: [Barras, Boton, Campo, CampoNumero, CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="titulo text-2xl">Mermas</h1>
        <p class="pt-1 text-sm text-tenue">
          Aquí se registra lo que se pierde ya estando en almacén. La merma del embolsado se anota
          al cerrar la producción.
        </p>
      </div>

      <div
        class="flex rounded-full border border-linea bg-superficie p-1"
        role="group"
        aria-label="Periodo del resumen"
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
    } @else if (resumen(); as datos) {
      <section
        class="lamina mt-7 grid divide-y divide-linea sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div class="p-5">
          <span class="rotulo block">Paletas perdidas</span>
          <span class="cifra block pt-1 text-2xl text-granate">{{ miles(datos.total) }}</span>
          <span class="block text-xs text-tenue">En el periodo elegido</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">En almacén</span>
          <span class="cifra block pt-1 text-2xl">{{ miles(datos.enAlmacen) }}</span>
          <span class="block text-xs text-tenue">Producto que ya estaba en stock</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">En proceso</span>
          <span class="cifra block pt-1 text-2xl">{{ miles(datos.enProceso) }}</span>
          <span class="block text-xs text-tenue">Perdido antes de entrar al stock</span>
        </div>
      </section>

      <div class="grid gap-8 pt-8 lg:grid-cols-[22rem_1fr]">
        <div class="space-y-6">
          @if (puedeRegistrar()) {
            <form class="lamina p-6" (submit)="registrar($event)">
              <h2 class="titulo text-base">Registrar merma</h2>
              <p class="pt-1 pb-5 text-sm text-tenue">Se descuenta del inventario al guardar.</p>

              <div class="space-y-4">
                <fz-campo-seleccion
                  etiqueta="Sabor"
                  vacio="Elige un sabor"
                  [opciones]="opcionesDeSabor()"
                  [valor]="saborId()"
                  (valorChange)="cambiarSabor($event)"
                />
                <fz-campo-numero
                  etiqueta="Paletas perdidas"
                  [ayuda]="ayudaCantidad()"
                  [minimo]="1"
                  [(valor)]="cantidad"
                />
                @if (excede()) {
                  <p class="text-sm text-granate">
                    Solo quedan {{ disponible() }} paletas de ese sabor.
                  </p>
                }
                <fz-campo-seleccion
                  etiqueta="Causa"
                  vacio="Elige una causa"
                  [opciones]="opcionesDeCausa()"
                  [(valor)]="causaId"
                />
                <fz-campo-seleccion
                  etiqueta="Lote"
                  vacio="El más antiguo con stock"
                  [opciones]="opcionesDeLote()"
                  [(valor)]="loteId"
                />
                <fz-campo
                  etiqueta="Observación"
                  ayuda="Obligatoria cuando la causa lo pide."
                  [(valor)]="observacion"
                />
                <fz-campo etiqueta="Fecha" tipo="date" [(valor)]="fecha" />
              </div>

              <div class="pt-6">
                <fz-boton
                  tipo="submit"
                  [ocupado]="enviando()"
                  [deshabilitado]="excede()"
                  [ancho]="true"
                  >Registrar merma</fz-boton
                >
              </div>
            </form>
          }

          @if (puedeAdministrarCausas()) {
            <section class="lamina p-6">
              <h2 class="titulo text-base">Causas</h2>
              <p class="pt-1 pb-4 text-sm text-tenue">
                Una causa con mermas registradas no se borra, se desactiva.
              </p>

              <ul class="space-y-1">
                @for (causa of causas(); track causa.id) {
                  <li class="flex items-center justify-between gap-3 border-t border-linea py-2">
                    <span class="min-w-0">
                      <span class="block truncate text-sm" [class.text-tenue]="!causa.activa">{{
                        causa.nombre
                      }}</span>
                      @if (causa.requiereDescripcion) {
                        <span class="text-xs text-tenue">pide observación</span>
                      }
                    </span>
                    <button
                      type="button"
                      class="shrink-0 text-sm text-tenue transition-colors hover:text-helado-hondo"
                      (click)="alternarCausa(causa)"
                    >
                      {{ causa.activa ? 'Desactivar' : 'Activar' }}
                    </button>
                  </li>
                }
              </ul>

              <div class="space-y-3 border-t border-linea pt-4">
                <fz-campo etiqueta="Causa nueva" [(valor)]="causaNueva" />
                <label class="flex items-center gap-2 text-sm text-tenue">
                  <input
                    type="checkbox"
                    class="size-4 accent-[var(--color-helado-hondo)]"
                    [checked]="causaPideTexto()"
                    (change)="causaPideTexto.set(!causaPideTexto())"
                  />
                  Exigir observación al usarla
                </label>
                <fz-boton tono="contorno" [ocupado]="creandoCausa()" (click)="crearCausa()"
                  >Añadir causa</fz-boton
                >
              </div>
            </section>
          }
        </div>

        <div class="min-w-0 space-y-10">
          <section class="lamina p-6">
            <h2 class="titulo text-lg">Por qué se pierde</h2>
            <p class="pb-5 text-sm text-tenue">
              Paletas perdidas por causa en el periodo. Es la lista por la que se empieza a atacar
              la merma.
            </p>
            <fz-barras [datos]="porCausa()" vacio="No se registraron mermas en el periodo." />
          </section>

          <section class="lamina p-6">
            <h2 class="titulo text-lg">Qué sabor se pierde más</h2>
            <fz-barras [datos]="porSabor()" vacio="No se registraron mermas en el periodo." />
          </section>

          <section>
            <h2 class="titulo text-lg">Registro</h2>
            <div class="grid max-w-2xl gap-4 py-4 sm:grid-cols-2">
              <fz-campo-seleccion
                etiqueta="Origen"
                vacio="Todos los orígenes"
                [opciones]="OPCIONES_ORIGEN"
                [(valor)]="filtroOrigen"
                (valorChange)="refrescar()"
              />
              <fz-campo-seleccion
                etiqueta="Causa"
                vacio="Todas las causas"
                [opciones]="opcionesDeCausaFiltro()"
                [(valor)]="filtroCausa"
                (valorChange)="refrescar()"
              />
            </div>

            <div class="lamina overflow-x-auto">
              <table class="w-full min-w-[42rem]">
                <thead>
                  <tr>
                    <th class="encabezado-tabla">Fecha</th>
                    <th class="encabezado-tabla">Sabor</th>
                    <th class="encabezado-tabla">Lote</th>
                    <th class="encabezado-tabla">Causa</th>
                    <th class="encabezado-tabla">Origen</th>
                    <th class="encabezado-tabla text-right">Paletas</th>
                  </tr>
                </thead>
                <tbody>
                  @for (merma of mermas(); track merma.id) {
                    <tr class="transition-colors hover:bg-hundido/50">
                      <td class="celda text-sm whitespace-nowrap">{{ fechaCorta(merma.fecha) }}</td>
                      <td class="celda text-sm">{{ merma.sabor }}</td>
                      <td class="celda text-sm text-tenue">{{ merma.lote ?? '—' }}</td>
                      <td class="celda text-sm">
                        <span class="block">{{ merma.causa }}</span>
                        @if (merma.observacion !== null) {
                          <span class="text-xs text-tenue">{{ merma.observacion }}</span>
                        }
                      </td>
                      <td class="celda">
                        <fz-chip [tono]="merma.descontoStock ? 'granate' : 'neutro'">{{
                          ORIGENES_MERMA[merma.origen]
                        }}</fz-chip>
                      </td>
                      <td class="celda cifra text-right text-sm">{{ merma.cantidad }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="celda text-sm text-tenue" colspan="6">
                        No hay mermas con esos filtros.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    }
  `,
})
export class MermasPagina {
  private readonly mermasService = inject(MermasService);
  private readonly inventarioService = inject(InventarioService);
  private readonly lotesService = inject(LotesService);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly mermas = signal<Merma[]>([]);
  protected readonly resumen = signal<ResumenMermas | null>(null);
  protected readonly stock = signal<StockSabor[]>([]);
  protected readonly causas = signal<CausaMerma[]>([]);
  protected readonly lotes = signal<Lote[]>([]);
  protected readonly cargando = signal(true);
  protected readonly periodo = signal<number>(30);

  protected readonly saborId = signal('');
  protected readonly cantidad = signal<number | null>(null);
  protected readonly causaId = signal('');
  protected readonly loteId = signal('');
  protected readonly observacion = signal('');
  protected readonly fecha = signal(hoyEnIso());
  protected readonly enviando = signal(false);

  protected readonly causaNueva = signal('');
  protected readonly causaPideTexto = signal(false);
  protected readonly creandoCausa = signal(false);

  protected readonly filtroOrigen = signal('');
  protected readonly filtroCausa = signal('');

  protected readonly PERIODOS = PERIODOS;
  protected readonly OPCIONES_ORIGEN = OPCIONES_ORIGEN;
  protected readonly ORIGENES_MERMA = ORIGENES_MERMA;
  protected readonly fechaCorta = fechaCorta;
  protected readonly miles = miles;

  protected readonly puedeRegistrar = computed(() => this.sesion.puede(PERMISOS.REGISTRAR_MERMAS));

  protected readonly puedeAdministrarCausas = computed(() =>
    this.sesion.puede(PERMISOS.ADMINISTRAR_SABORES),
  );

  protected readonly opcionesDeSabor = computed<Opcion[]>(() =>
    this.stock().map((sabor) => ({
      valor: sabor.saborId,
      texto: `${sabor.nombre} (${sabor.stock})`,
    })),
  );

  protected readonly opcionesDeCausa = computed<Opcion[]>(() =>
    this.causas()
      .filter((causa) => causa.activa)
      .map((causa) => ({ valor: causa.id, texto: causa.nombre })),
  );

  protected readonly opcionesDeCausaFiltro = computed<Opcion[]>(() =>
    this.causas().map((causa) => ({ valor: causa.id, texto: causa.nombre })),
  );

  protected readonly opcionesDeLote = computed<Opcion[]>(() =>
    this.lotes()
      .filter((lote) => lote.saborId === this.saborId())
      .map((lote) => ({ valor: lote.id, texto: `${lote.codigo} (quedan ${lote.stockRestante})` })),
  );

  protected readonly disponible = computed(() => {
    if (this.loteId() !== '') {
      return this.lotes().find((lote) => lote.id === this.loteId())?.stockRestante ?? 0;
    }

    return this.stock().find((sabor) => sabor.saborId === this.saborId())?.stock ?? 0;
  });

  protected readonly excede = computed(
    () => this.saborId() !== '' && (this.cantidad() ?? 0) > this.disponible(),
  );

  protected readonly ayudaCantidad = computed(() =>
    this.saborId() === '' ? 'Elige primero el sabor.' : `Quedan ${this.disponible()} paletas.`,
  );

  protected readonly porCausa = computed<FilaBarra[]>(
    () =>
      this.resumen()?.porCausa.map((fila) => ({
        id: fila.causa,
        etiqueta: fila.causa,
        detalle: `${fila.cantidad} paletas en ${fila.registros} registros`,
        valor: fila.cantidad,
        tono: 'granate' as const,
      })) ?? [],
  );

  protected readonly porSabor = computed<FilaBarra[]>(
    () =>
      this.resumen()?.porSabor.map((fila) => ({
        id: fila.sabor,
        etiqueta: fila.sabor,
        detalle: `${fila.cantidad} paletas perdidas`,
        valor: fila.cantidad,
        tono: 'granate' as const,
      })) ?? [],
  );

  constructor() {
    void this.cargar();
  }

  protected cambiarSabor(valor: string): void {
    this.saborId.set(valor);
    this.loteId.set('');
  }

  protected cambiarPeriodo(dias: number): void {
    this.periodo.set(dias);
    void this.cargarResumen();
  }

  protected async crearCausa(): Promise<void> {
    if (this.causaNueva().trim().length < 3) {
      this.avisos.error('Escribe el nombre de la causa.');
      return;
    }

    this.creandoCausa.set(true);

    try {
      await this.mermasService.crearCausa(this.causaNueva().trim(), this.causaPideTexto());
      this.causas.set(await this.mermasService.causas());
      this.causaNueva.set('');
      this.causaPideTexto.set(false);
      this.avisos.exito('Causa añadida al catálogo.');
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.creandoCausa.set(false);
    }
  }

  protected async alternarCausa(causa: CausaMerma): Promise<void> {
    try {
      if (causa.activa) {
        await this.mermasService.desactivarCausa(causa.id);
      } else {
        await this.mermasService.activarCausa(causa.id);
      }

      this.causas.set(await this.mermasService.causas());
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  protected async registrar(evento: Event): Promise<void> {
    evento.preventDefault();

    const cantidad = this.cantidad();

    if (this.saborId() === '' || cantidad === null || cantidad < 1 || this.causaId() === '') {
      this.avisos.error('Completa el sabor, la cantidad y la causa.');
      return;
    }

    this.enviando.set(true);

    try {
      await this.mermasService.registrar({
        saborId: this.saborId(),
        cantidad,
        causaId: this.causaId(),
        loteId: this.loteId() === '' ? undefined : this.loteId(),
        observacion: this.observacion() === '' ? undefined : this.observacion(),
        fecha: this.fecha(),
        claveIdempotencia: crypto.randomUUID(),
      });

      this.avisos.exito('Merma registrada y descontada del inventario.');
      this.cantidad.set(null);
      this.observacion.set('');
      this.loteId.set('');
      await this.refrescar();
      await this.cargarResumen();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.enviando.set(false);
    }
  }

  protected async refrescar(): Promise<void> {
    try {
      const [mermas, lotes, inventario] = await Promise.all([
        this.mermasService.listar({
          origen: this.filtroOrigen() === '' ? undefined : (this.filtroOrigen() as OrigenMerma),
          causaId: this.filtroCausa() === '' ? undefined : this.filtroCausa(),
          limite: 100,
        }),
        this.lotesService.listar({ conStock: true, limite: 200 }),
        this.inventarioService.resumen(),
      ]);

      this.mermas.set(mermas);
      this.lotes.set(lotes);
      this.stock.set(inventario.sabores);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private async cargarResumen(): Promise<void> {
    try {
      this.resumen.set(await this.mermasService.resumen(haceDias(this.periodo()), hoyEnIso()));
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private async cargar(): Promise<void> {
    try {
      this.causas.set(await this.mermasService.causas());
      await Promise.all([this.refrescar(), this.cargarResumen()]);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
