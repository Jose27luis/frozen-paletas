import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ESTADOS_PRODUCCION, PERMISOS } from '../nucleo/etiquetas';
import { fechaCorta, hoyEnIso } from '../nucleo/formato';
import { MermasService } from '../nucleo/mermas.service';
import { CausaMerma, Produccion, Sabor } from '../nucleo/modelos';
import { ProduccionService } from '../nucleo/produccion.service';
import { SaboresService } from '../nucleo/sabores.service';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';

@Component({
  selector: 'fz-produccion-pagina',
  imports: [Boton, Campo, CampoNumero, CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Producción</h1>
    <p class="pt-1 text-sm text-tenue">
      Lo producido entra al stock recién cuando se registra el conteo del embolsado.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-8 lg:grid-cols-[22rem_1fr]">
        @if (puedeRegistrar()) {
          <form class="lamina h-fit p-6" (submit)="registrar($event)">
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

        <div class="min-w-0">
          <section>
            <h2 class="titulo text-lg">Falta embolsar</h2>
            <p class="pb-4 text-sm text-tenue">
              Estas producciones todavía no suman al inventario.
            </p>

            <ul class="lamina divide-y divide-linea">
              @for (produccion of pendientes(); track produccion.id) {
                <li class="p-5">
                  <div class="flex flex-wrap items-baseline justify-between gap-3">
                    <span>
                      <span class="block text-sm">{{ produccion.sabor }}</span>
                      <span class="flex items-baseline gap-2 text-xs text-tenue">
                        <span>{{ produccion.lote }}</span>
                        <span>{{ fechaCorta(produccion.fecha) }}</span>
                        <span>{{ produccion.responsable }}</span>
                      </span>
                    </span>
                    <span class="flex items-center gap-3">
                      <span class="cifra text-lg">{{ produccion.cantidadObtenida }}</span>
                      @if (puedeRegistrar()) {
                        <fz-boton tono="contorno" (click)="abrir(produccion)">{{
                          abierta() === produccion.id ? 'Cerrar' : 'Embolsar'
                        }}</fz-boton>
                      }
                    </span>
                  </div>

                  @if (abierta() === produccion.id) {
                    <form class="grid gap-4 pt-5 sm:grid-cols-2" (submit)="embolsar($event)">
                      <fz-campo-numero
                        etiqueta="Paletas embolsadas y aptas"
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
                </li>
              } @empty {
                <li class="p-5 text-sm text-tenue">
                  Todo lo producido ya pasó por el conteo del embolsado.
                </li>
              }
            </ul>
          </section>

          <section class="pt-10">
            <h2 class="titulo text-lg">Historial</h2>
            <div class="lamina mt-4 overflow-x-auto">
              <table class="w-full min-w-[38rem]">
                <thead>
                  <tr>
                    <th class="encabezado-tabla">Fecha</th>
                    <th class="encabezado-tabla">Sabor</th>
                    <th class="encabezado-tabla">Lote</th>
                    <th class="encabezado-tabla text-right">Obtenido</th>
                    <th class="encabezado-tabla text-right">Embolsado</th>
                    <th class="encabezado-tabla text-right">Merma</th>
                    <th class="encabezado-tabla">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (produccion of producciones(); track produccion.id) {
                    <tr>
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
                      <td class="celda">
                        <fz-chip [tono]="produccion.estado === 'EMBOLSADA' ? 'hoja' : 'aguaje'">{{
                          ESTADOS_PRODUCCION[produccion.estado]
                        }}</fz-chip>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td class="celda text-sm text-tenue" colspan="7">
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
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly producciones = signal<Produccion[]>([]);
  protected readonly pendientes = signal<Produccion[]>([]);
  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly causas = signal<CausaMerma[]>([]);
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

  protected readonly ESTADOS_PRODUCCION = ESTADOS_PRODUCCION;
  protected readonly fechaCorta = fechaCorta;

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

  protected readonly hayMerma = computed(() => {
    const produccion = this.pendientes().find((fila) => fila.id === this.abierta());
    const embolsada = this.cantidadEmbolsada();

    return (
      produccion !== undefined && embolsada !== null && embolsada < produccion.cantidadObtenida
    );
  });

  constructor() {
    void this.cargar();
  }

  protected abrir(produccion: Produccion): void {
    const yaAbierta = this.abierta() === produccion.id;

    this.abierta.set(yaAbierta ? null : produccion.id);
    this.cantidadEmbolsada.set(yaAbierta ? null : produccion.cantidadObtenida);
    this.causaElegida.set('');
    this.observacion.set('');
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
      await this.produccionService.registrar({
        saborId,
        cantidadObtenida: cantidad,
        fecha: this.fechaNueva(),
        claveIdempotencia: crypto.randomUUID(),
      });

      this.avisos.exito('Producción registrada. Falta el conteo del embolsado.');
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
    const [pendientes, producciones] = await Promise.all([
      this.produccionService.pendientes(),
      this.produccionService.listar({ limite: 50 }),
    ]);

    this.pendientes.set(pendientes);
    this.producciones.set(producciones);
  }
}
