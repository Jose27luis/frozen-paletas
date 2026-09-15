import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { DestinosService } from '../nucleo/destinos.service';
import { mensajeDe } from '../nucleo/errores';
import { PERMISOS, TIPOS_SALIDA } from '../nucleo/etiquetas';
import { fechaCorta, hoyEnIso, soles } from '../nucleo/formato';
import { LotesService } from '../nucleo/lotes.service';
import { Destino, Lote, Sabor, Salida, TipoSalida } from '../nucleo/modelos';
import { SaboresService } from '../nucleo/sabores.service';
import { SalidasService } from '../nucleo/salidas.service';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';

interface Linea {
  saborId: string;
  cantidad: number | null;
  loteId: string;
}

const TIPOS_CON_DESTINO: readonly TipoSalida[] = ['PDV', 'MAYORISTA', 'DELIVERY', 'FERIA'];

const OPCIONES_TIPO: readonly Opcion[] = (Object.keys(TIPOS_SALIDA) as TipoSalida[]).map(
  (tipo) => ({ valor: tipo, texto: TIPOS_SALIDA[tipo] }),
);

function lineaVacia(): Linea {
  return { saborId: '', cantidad: null, loteId: '' };
}

@Component({
  selector: 'fz-salidas-pagina',
  imports: [Boton, Campo, CampoNumero, CampoSeleccion, Cargador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Salidas</h1>
    <p class="pt-1 text-sm text-tenue">
      Sin lote elegido, el descuento sale del lote más antiguo con stock.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-8 lg:grid-cols-[24rem_1fr]">
        @if (puedeRegistrar()) {
          <form class="lamina h-fit p-6" (submit)="registrar($event)">
            <h2 class="titulo text-base">Registrar salida</h2>

            <div class="space-y-4 pt-5">
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
              }

              @if (pideMotivo()) {
                <fz-campo
                  etiqueta="Motivo"
                  ayuda="Explica a dónde va el producto."
                  [(valor)]="motivo"
                />
              }

              <fz-campo etiqueta="Fecha" tipo="date" [(valor)]="fecha" />
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
                    [minimo]="1"
                    [valor]="linea.cantidad"
                    (valorChange)="cambiarCantidad($index, $event)"
                  />
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

            <div class="flex flex-wrap gap-3 pt-5">
              <fz-boton tono="contorno" (click)="agregarLinea()">Añadir sabor</fz-boton>
              <fz-boton tipo="submit" [ocupado]="enviando()">Registrar salida</fz-boton>
            </div>
          </form>
        }

        <div class="min-w-0">
          <div class="lamina overflow-x-auto">
            <table class="w-full min-w-[40rem]">
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
                  <tr>
                    <td class="celda text-sm whitespace-nowrap">{{ fechaCorta(salida.fecha) }}</td>
                    <td class="celda text-sm">{{ TIPOS_SALIDA[salida.tipo] }}</td>
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
                    <td class="celda text-sm text-tenue" colspan="6">Sin salidas registradas.</td>
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
  private readonly saboresService = inject(SaboresService);
  private readonly destinosService = inject(DestinosService);
  private readonly lotesService = inject(LotesService);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly salidas = signal<Salida[]>([]);
  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly destinos = signal<Destino[]>([]);
  protected readonly lotes = signal<Lote[]>([]);
  protected readonly cargando = signal(true);

  protected readonly tipo = signal<TipoSalida>('PDV');
  protected readonly destinoId = signal('');
  protected readonly motivo = signal('');
  protected readonly fecha = signal(hoyEnIso());
  protected readonly lineas = signal<Linea[]>([lineaVacia()]);
  protected readonly enviando = signal(false);

  protected readonly OPCIONES_TIPO = OPCIONES_TIPO;
  protected readonly TIPOS_SALIDA = TIPOS_SALIDA;
  protected readonly fechaCorta = fechaCorta;
  protected readonly soles = soles;

  protected readonly puedeRegistrar = computed(() => this.sesion.puede(PERMISOS.REGISTRAR_SALIDAS));

  protected readonly pideDestino = computed(() => TIPOS_CON_DESTINO.includes(this.tipo()));

  protected readonly pideMotivo = computed(() => this.tipo() === 'OTRA' || this.destinoId() === '');

  protected readonly opcionesDeSabor = computed<Opcion[]>(() =>
    this.sabores()
      .filter((sabor) => sabor.estado !== 'INACTIVO')
      .map((sabor) => ({ valor: sabor.id, texto: sabor.nombre })),
  );

  protected readonly opcionesDeDestino = computed<Opcion[]>(() =>
    this.destinos()
      .filter((destino) => destino.tipo === this.tipo() && destino.activo)
      .map((destino) => ({ valor: destino.id, texto: destino.nombre })),
  );

  constructor() {
    void this.cargar();
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

  protected async registrar(evento: Event): Promise<void> {
    evento.preventDefault();

    const detalles = this.lineas()
      .filter((linea) => linea.saborId !== '' && linea.cantidad !== null && linea.cantidad > 0)
      .map((linea) => ({
        saborId: linea.saborId,
        cantidad: linea.cantidad ?? 0,
        loteId: linea.loteId === '' ? undefined : linea.loteId,
      }));

    if (detalles.length === 0) {
      this.avisos.error('Añade al menos un sabor con su cantidad.');
      return;
    }

    this.enviando.set(true);

    try {
      await this.salidasService.registrar({
        tipo: this.tipo(),
        destinoId: this.destinoId() === '' ? undefined : this.destinoId(),
        motivo: this.motivo() === '' ? undefined : this.motivo(),
        fecha: this.fecha(),
        detalles,
        claveIdempotencia: crypto.randomUUID(),
      });

      this.avisos.exito('Salida registrada y descontada del inventario.');
      this.lineas.set([lineaVacia()]);
      this.motivo.set('');
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.enviando.set(false);
    }
  }

  private actualizarLinea(indice: number, cambios: Partial<Linea>): void {
    this.lineas.update((lineas) =>
      lineas.map((linea, posicion) => (posicion === indice ? { ...linea, ...cambios } : linea)),
    );
  }

  private async cargar(): Promise<void> {
    try {
      const [sabores, destinos] = await Promise.all([
        this.saboresService.listar(),
        this.destinosService.listar(undefined, true),
      ]);

      this.sabores.set(sabores);
      this.destinos.set(destinos);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }

  private async refrescar(): Promise<void> {
    const [salidas, lotes] = await Promise.all([
      this.salidasService.listar({ limite: 50 }),
      this.lotesService.listar({ conStock: true, limite: 200 }),
    ]);

    this.salidas.set(salidas);
    this.lotes.set(lotes);
  }
}
