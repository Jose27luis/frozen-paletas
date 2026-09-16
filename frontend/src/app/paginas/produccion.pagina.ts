import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ESTADOS_PRODUCCION, PERMISOS } from '../nucleo/etiquetas';
import { TONO_DE_LA_PRODUCCION } from '../nucleo/estados';
import { fechaCorta, hoyEnIso, miles } from '../nucleo/formato';
import { InventarioService } from '../nucleo/inventario.service';
import { MermasService } from '../nucleo/mermas.service';
import { CausaMerma, Produccion, Sabor, StockSabor } from '../nucleo/modelos';
import { ProduccionService } from '../nucleo/produccion.service';
import { SaboresService } from '../nucleo/sabores.service';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';

const PALETAS_POR_BALDE = 150;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

@Component({
  selector: 'fz-produccion-pagina',
  imports: [Boton, Campo, CampoNumero, CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Producción</h1>
    <p class="pt-1 text-sm text-tenue">
      Lo producido entra al stock recién cuando registras el conteo del embolsado.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado-hondo"><fz-cargador /></div>
    } @else {
      <section
        class="lamina mt-7 grid divide-y divide-linea sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div class="p-5">
          <span class="rotulo block">Producido hoy</span>
          <span class="cifra block pt-1 text-2xl">{{ miles(producidoHoy()) }}</span>
          <span class="block text-xs text-tenue">{{ apunteHoy() }}</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">Falta embolsar</span>
          <span class="cifra block pt-1 text-2xl" [class.text-aguaje]="pendientes().length > 0">{{
            pendientes().length
          }}</span>
          <span class="block text-xs text-tenue">{{ apuntePendientes() }}</span>
        </div>
        <div class="p-5">
          <span class="rotulo block">Rendimiento</span>
          <span class="cifra block pt-1 text-2xl">{{ rendimiento() }}%</span>
          <span class="block text-xs text-tenue">De lo embolsado en el historial</span>
        </div>
      </section>

      <div class="grid gap-8 pt-8 lg:grid-cols-[22rem_1fr]">
        <div class="space-y-6">
          @if (puedeRegistrar()) {
            <form class="lamina p-6" (submit)="registrar($event)">
              <h2 class="titulo text-base">Registrar producción</h2>
              <p class="pt-1 pb-5 text-sm text-tenue">Lo que salió del balde, antes de embolsar.</p>

              <div class="space-y-4">
                <fz-campo-seleccion
                  etiqueta="Sabor"
                  vacio="Elige un sabor"
                  [opciones]="opcionesDeSabor()"
                  [(valor)]="saborNuevo"
                />
                <fz-campo-numero
                  etiqueta="Paletas obtenidas"
                  [ayuda]="ayudaCantidad()"
                  [minimo]="1"
                  [(valor)]="cantidadNueva"
                />
                <fz-campo etiqueta="Fecha" tipo="date" [(valor)]="fechaNueva" />
              </div>

              <div class="pt-6">
                <fz-boton tipo="submit" [ocupado]="registrando()" [ancho]="true"
                  >Registrar producción</fz-boton
                >
              </div>
            </form>
          }

          <section class="lamina p-6">
            <h2 class="titulo text-base">Qué conviene producir</h2>
            <p class="pt-1 pb-4 text-sm text-tenue">
              Sabores activos que llegaron a su mínimo. Toca uno para cargarlo arriba.
            </p>

            <ul class="space-y-1.5">
              @for (sabor of aReponer(); track sabor.saborId) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-baseline justify-between gap-3 rounded-[var(--radius-campo)] border border-linea px-3 py-2 text-left transition-colors hover:border-helado hover:bg-hundido/60"
                    [class.border-helado-hondo]="saborNuevo() === sabor.saborId"
                    (click)="elegirSabor(sabor)"
                  >
                    <span class="min-w-0">
                      <span class="block truncate text-sm">{{ sabor.nombre }}</span>
                      <span class="text-xs text-tenue">mínimo {{ sabor.stockMinimo }}</span>
                    </span>
                    <span
                      class="cifra shrink-0 text-sm"
                      [class.text-granate]="sabor.stock === 0"
                      [class.text-aguaje]="sabor.stock > 0"
                      >{{ sabor.stock }}</span
                    >
                  </button>
                </li>
              } @empty {
                <li class="text-sm text-tenue">
                  Ningún sabor activo llegó al mínimo. Produce lo que quieras adelantar.
                </li>
              }
            </ul>
          </section>
        </div>

        <div class="min-w-0 space-y-10">
          <section>
            <h2 class="titulo text-lg">Falta embolsar</h2>
            <p class="pb-4 text-sm text-tenue">
              Estas producciones todavía no suman al inventario.
            </p>

            <ul class="space-y-2">
              @for (produccion of pendientes(); track produccion.id) {
                <li class="lamina p-5" [class.border-aguaje]="espera(produccion) >= 1">
                  <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0">
                      <p class="titulo text-base">{{ produccion.sabor }}</p>
                      <p class="flex flex-wrap items-baseline gap-x-3 pt-1 text-xs text-tenue">
                        <span>{{ fechaCorta(produccion.fecha) }}</span>
                        <span>{{ produccion.responsable }}</span>
                        @if (espera(produccion) >= 1) {
                          <span class="text-aguaje">esperando {{ espera(produccion) }} días</span>
                        }
                      </p>
                      <p class="cifra pt-3 text-lg tracking-tight text-helado-hondo">
                        {{ produccion.lote }}
                      </p>
                      <p class="text-xs text-tenue">Código para rotular las bolsas</p>
                    </div>

                    <div class="text-right">
                      <span class="cifra block text-2xl">{{ produccion.cantidadObtenida }}</span>
                      <span class="text-xs text-tenue">salieron del balde</span>
                    </div>
                  </div>

                  @if (puedeRegistrar()) {
                    <div class="flex flex-wrap gap-3 pt-4">
                      <fz-boton tono="contorno" (click)="abrir(produccion)">{{
                        abierta() === produccion.id ? 'Cerrar' : 'Registrar embolsado'
                      }}</fz-boton>
                      <fz-boton tono="fantasma" (click)="pedirAnular(produccion)">Anular</fz-boton>
                    </div>
                  }

                  @if (abierta() === produccion.id) {
                    <form class="grid gap-4 pt-5 sm:grid-cols-2" (submit)="embolsar($event)">
                      <fz-campo-numero
                        etiqueta="Paletas embolsadas y aptas"
                        [ayuda]="ayudaEmbolsado(produccion)"
                        [minimo]="0"
                        [(valor)]="cantidadEmbolsada"
                      />
                      @if (hayMerma()) {
                        <fz-campo-seleccion
                          etiqueta="Causa de las paletas perdidas"
                          vacio="Elige una causa"
                          [opciones]="opcionesDeCausa()"
                          [(valor)]="causaElegida"
                        />
                        <fz-campo
                          etiqueta="Observación"
                          ayuda="Obligatoria si la causa lo pide."
                          [(valor)]="observacion"
                        />
                      }
                      <div class="sm:col-span-2">
                        <fz-boton tipo="submit" [ocupado]="embolsando()"
                          >Ingresar al stock</fz-boton
                        >
                      </div>
                    </form>
                  }

                  @if (anulando() === produccion.id) {
                    <form
                      class="mt-4 rounded-[var(--radius-campo)] border border-granate/40 bg-granate/5 p-4"
                      (submit)="anular($event)"
                    >
                      <p class="text-sm text-tinta">
                        Anular descarta esta producción y su lote. No toca el stock, porque todavía
                        no había entrado.
                      </p>
                      <div class="pt-3">
                        <fz-campo etiqueta="Motivo" [(valor)]="motivo" />
                      </div>
                      <div class="flex gap-3 pt-4">
                        <fz-boton tipo="submit" tono="alerta" [ocupado]="confirmando()"
                          >Anular producción</fz-boton
                        >
                        <fz-boton tono="fantasma" (click)="anulando.set(null)">Mejor no</fz-boton>
                      </div>
                    </form>
                  }
                </li>
              } @empty {
                <li class="lamina p-6 text-sm text-tenue">
                  Todo lo producido ya pasó por el conteo del embolsado.
                </li>
              }
            </ul>
          </section>

          <section>
            <h2 class="titulo text-lg">Historial</h2>
            <div class="lamina mt-4 overflow-x-auto">
              <table class="w-full min-w-[42rem]">
                <thead>
                  <tr>
                    <th class="encabezado-tabla">Fecha</th>
                    <th class="encabezado-tabla">Sabor</th>
                    <th class="encabezado-tabla">Lote</th>
                    <th class="encabezado-tabla text-right">Obtenido</th>
                    <th class="encabezado-tabla text-right">Embolsado</th>
                    <th class="encabezado-tabla text-right">Merma</th>
                    <th class="encabezado-tabla text-right">Rendimiento</th>
                    <th class="encabezado-tabla">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (produccion of producciones(); track produccion.id) {
                    <tr class="transition-colors hover:bg-hundido/50">
                      <td class="celda text-sm whitespace-nowrap">
                        {{ fechaCorta(produccion.fecha) }}
                      </td>
                      <td class="celda text-sm">{{ produccion.sabor }}</td>
                      <td class="celda text-sm text-tenue">{{ produccion.lote }}</td>
                      <td class="celda cifra text-right text-sm">
                        {{ produccion.cantidadObtenida }}
                      </td>
                      <td class="celda cifra text-right text-sm">
                        {{ produccion.cantidadEmbolsada ?? '—' }}
                      </td>
                      <td class="celda cifra text-right text-sm text-granate">
                        {{ produccion.merma ?? '—' }}
                      </td>
                      <td class="celda cifra text-right text-sm">
                        {{ rendimientoDe(produccion) }}
                      </td>
                      <td class="celda">
                        <fz-chip [tono]="TONO_DE_LA_PRODUCCION[produccion.estado]">{{
                          ESTADOS_PRODUCCION[produccion.estado]
                        }}</fz-chip>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="celda text-sm text-tenue" colspan="8">
                        Sin producciones registradas.
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
export class ProduccionPagina {
  private readonly produccionService = inject(ProduccionService);
  private readonly saboresService = inject(SaboresService);
  private readonly mermasService = inject(MermasService);
  private readonly inventarioService = inject(InventarioService);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly producciones = signal<Produccion[]>([]);
  protected readonly pendientes = signal<Produccion[]>([]);
  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly causas = signal<CausaMerma[]>([]);
  protected readonly aReponer = signal<StockSabor[]>([]);
  protected readonly cargando = signal(true);

  protected readonly saborNuevo = signal('');
  protected readonly cantidadNueva = signal<number | null>(null);
  protected readonly fechaNueva = signal(hoyEnIso());
  protected readonly registrando = signal(false);

  protected readonly abierta = signal<string | null>(null);
  protected readonly cantidadEmbolsada = signal<number | null>(null);
  protected readonly causaElegida = signal('');
  protected readonly observacion = signal('');
  protected readonly embolsando = signal(false);

  protected readonly anulando = signal<string | null>(null);
  protected readonly motivo = signal('');
  protected readonly confirmando = signal(false);

  protected readonly ESTADOS_PRODUCCION = ESTADOS_PRODUCCION;
  protected readonly TONO_DE_LA_PRODUCCION = TONO_DE_LA_PRODUCCION;
  protected readonly fechaCorta = fechaCorta;
  protected readonly miles = miles;

  protected readonly puedeRegistrar = computed(() =>
    this.sesion.puede(PERMISOS.REGISTRAR_PRODUCCION),
  );

  protected readonly opcionesDeSabor = computed<Opcion[]>(() =>
    this.sabores()
      .filter((sabor) => sabor.estado !== 'INACTIVO')
      .map((sabor) => ({ valor: sabor.id, texto: sabor.nombre })),
  );

  protected readonly opcionesDeCausa = computed<Opcion[]>(() =>
    this.causas()
      .filter((causa) => causa.activa)
      .map((causa) => ({ valor: causa.id, texto: causa.nombre })),
  );

  protected readonly producidoHoy = computed(() =>
    this.producciones()
      .filter((produccion) => produccion.fecha.slice(0, 10) === hoyEnIso())
      .reduce((suma, produccion) => suma + produccion.cantidadObtenida, 0),
  );

  protected readonly apunteHoy = computed(() => {
    const paletas = this.producidoHoy();

    if (paletas === 0) {
      return 'Todavía no se registra nada hoy';
    }

    const baldes = Math.round((paletas / PALETAS_POR_BALDE) * 10) / 10;

    return `Unos ${baldes} baldes`;
  });

  protected readonly apuntePendientes = computed(() => {
    const paletas = this.pendientes().reduce(
      (suma, produccion) => suma + produccion.cantidadObtenida,
      0,
    );

    return paletas === 0 ? 'Nada esperando conteo' : `${miles(paletas)} paletas sin ingresar`;
  });

  protected readonly rendimiento = computed(() => {
    const embolsadas = this.producciones().filter(
      (produccion) => produccion.cantidadEmbolsada !== null,
    );

    const obtenido = embolsadas.reduce((suma, produccion) => suma + produccion.cantidadObtenida, 0);
    const aptas = embolsadas.reduce(
      (suma, produccion) => suma + (produccion.cantidadEmbolsada ?? 0),
      0,
    );

    return obtenido === 0 ? '0.0' : ((aptas / obtenido) * 100).toFixed(1);
  });

  protected readonly hayMerma = computed(() => {
    const produccion = this.pendientes().find((fila) => fila.id === this.abierta());
    const embolsada = this.cantidadEmbolsada();

    return (
      produccion !== undefined && embolsada !== null && embolsada < produccion.cantidadObtenida
    );
  });

  protected readonly ayudaCantidad = computed(
    () => `Un balde rinde unas ${PALETAS_POR_BALDE} paletas.`,
  );

  constructor() {
    void this.cargar();
  }

  protected espera(produccion: Produccion): number {
    const fecha = new Date(`${produccion.fecha.slice(0, 10)}T00:00:00.000Z`).getTime();
    const hoy = new Date(`${hoyEnIso()}T00:00:00.000Z`).getTime();

    return Math.max(0, Math.round((hoy - fecha) / MILISEGUNDOS_POR_DIA));
  }

  protected ayudaEmbolsado(produccion: Produccion): string {
    return `Como máximo ${produccion.cantidadObtenida}, que es lo que salió del balde.`;
  }

  protected rendimientoDe(produccion: Produccion): string {
    if (produccion.cantidadEmbolsada === null || produccion.cantidadObtenida === 0) {
      return '—';
    }

    return `${((produccion.cantidadEmbolsada / produccion.cantidadObtenida) * 100).toFixed(1)}%`;
  }

  protected elegirSabor(sabor: StockSabor): void {
    this.saborNuevo.set(sabor.saborId);
  }

  protected abrir(produccion: Produccion): void {
    const yaAbierta = this.abierta() === produccion.id;

    this.anulando.set(null);
    this.abierta.set(yaAbierta ? null : produccion.id);
    this.cantidadEmbolsada.set(yaAbierta ? null : produccion.cantidadObtenida);
    this.causaElegida.set('');
    this.observacion.set('');
  }

  protected pedirAnular(produccion: Produccion): void {
    this.abierta.set(null);
    this.motivo.set('');
    this.anulando.set(this.anulando() === produccion.id ? null : produccion.id);
  }

  protected async registrar(evento: Event): Promise<void> {
    evento.preventDefault();

    const saborId = this.saborNuevo();
    const cantidad = this.cantidadNueva();

    if (saborId === '' || cantidad === null || cantidad < 1) {
      this.avisos.error('Elige el sabor y escribe cuántas paletas se obtuvieron.');
      return;
    }

    this.registrando.set(true);

    try {
      const creada = await this.produccionService.registrar({
        saborId,
        cantidadObtenida: cantidad,
        fecha: this.fechaNueva(),
        claveIdempotencia: crypto.randomUUID(),
      });

      this.avisos.exito(`Lote ${creada.lote ?? ''} registrado. Falta el conteo del embolsado.`);
      this.saborNuevo.set('');
      this.cantidadNueva.set(null);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.registrando.set(false);
    }
  }

  protected async embolsar(evento: Event): Promise<void> {
    evento.preventDefault();

    const id = this.abierta();
    const cantidad = this.cantidadEmbolsada();

    if (id === null || cantidad === null) {
      return;
    }

    this.embolsando.set(true);

    try {
      await this.produccionService.embolsar(id, {
        cantidadEmbolsada: cantidad,
        causaId: this.causaElegida() === '' ? undefined : this.causaElegida(),
        observacion: this.observacion() === '' ? undefined : this.observacion(),
      });

      this.avisos.exito('Embolsado registrado. Las paletas ya están en el stock.');
      this.abierta.set(null);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.embolsando.set(false);
    }
  }

  protected async anular(evento: Event): Promise<void> {
    evento.preventDefault();

    const id = this.anulando();

    if (id === null || this.motivo().trim().length < 5) {
      this.avisos.error('Escribe el motivo de la anulación.');
      return;
    }

    this.confirmando.set(true);

    try {
      await this.produccionService.anular(id, this.motivo().trim());
      this.avisos.exito('Producción anulada.');
      this.anulando.set(null);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.confirmando.set(false);
    }
  }

  private async cargar(): Promise<void> {
    try {
      const [sabores, causas] = await Promise.all([
        this.saboresService.listar(),
        this.mermasService.causas(),
      ]);

      this.sabores.set(sabores);
      this.causas.set(causas);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }

  private async refrescar(): Promise<void> {
    const [pendientes, producciones, aReponer] = await Promise.all([
      this.produccionService.pendientes(),
      this.produccionService.listar({ limite: 50 }),
      this.inventarioService.aReponer(),
    ]);

    this.pendientes.set(pendientes);
    this.producciones.set(producciones);
    this.aReponer.set(aReponer);
  }
}
