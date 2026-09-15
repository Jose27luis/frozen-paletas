import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ESTADOS_LOTE } from '../nucleo/etiquetas';
import { fechaLarga } from '../nucleo/formato';
import { EstadoLote, Lote, Sabor } from '../nucleo/modelos';
import { LotesService } from '../nucleo/lotes.service';
import { SaboresService } from '../nucleo/sabores.service';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip, TonoChip } from '../ui/chip';

const TONOS: Readonly<Record<EstadoLote, TonoChip>> = {
  PENDIENTE: 'neutro',
  ABIERTO: 'hoja',
  PARCIAL: 'helado',
  AGOTADO: 'neutro',
};

@Component({
  selector: 'fz-lotes-pagina',
  imports: [CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Lotes</h1>
    <p class="pt-1 text-sm text-tenue">
      Cada producción genera un lote. Un lote agotado sigue consultable para la trazabilidad.
    </p>

    <div class="grid max-w-xl gap-4 pt-6 sm:grid-cols-2">
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
    </div>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else {
      <div class="lamina mt-6 overflow-x-auto">
        <table class="w-full min-w-[42rem]">
          <thead>
            <tr>
              <th class="encabezado-tabla">Código</th>
              <th class="encabezado-tabla">Sabor</th>
              <th class="encabezado-tabla">Producido</th>
              <th class="encabezado-tabla text-right">Ingresó</th>
              <th class="encabezado-tabla text-right">Queda</th>
              <th class="encabezado-tabla">Estado</th>
              <th class="encabezado-tabla">Responsable</th>
            </tr>
          </thead>
          <tbody>
            @for (lote of lotes(); track lote.id) {
              <tr>
                <td class="celda text-sm whitespace-nowrap">{{ lote.codigo }}</td>
                <td class="celda text-sm">{{ lote.sabor }}</td>
                <td class="celda text-sm whitespace-nowrap text-tenue">
                  {{ fechaLarga(lote.fechaProduccion) }}
                </td>
                <td class="celda cifra text-right text-sm">{{ lote.cantidadIngresada }}</td>
                <td class="celda cifra text-right text-sm">{{ lote.stockRestante }}</td>
                <td class="celda">
                  <fz-chip [tono]="TONOS[lote.estado]">{{ ESTADOS_LOTE[lote.estado] }}</fz-chip>
                </td>
                <td class="celda text-sm text-tenue">{{ lote.responsable }}</td>
              </tr>
            } @empty {
              <tr>
                <td class="celda text-sm text-tenue" colspan="7">No hay lotes con ese filtro.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class LotesPagina {
  private readonly lotesService = inject(LotesService);
  private readonly saboresService = inject(SaboresService);
  private readonly avisos = inject(AvisosService);

  protected readonly lotes = signal<Lote[]>([]);
  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly cargando = signal(true);
  protected readonly saborId = signal('');
  protected readonly estado = signal('');

  protected readonly ESTADOS_LOTE = ESTADOS_LOTE;
  protected readonly TONOS = TONOS;
  protected readonly fechaLarga = fechaLarga;

  protected readonly OPCIONES_ESTADO: readonly Opcion[] = (
    Object.keys(ESTADOS_LOTE) as EstadoLote[]
  ).map((estado) => ({ valor: estado, texto: ESTADOS_LOTE[estado] }));

  protected readonly opcionesDeSabor = computed<Opcion[]>(() =>
    this.sabores().map((sabor) => ({ valor: sabor.id, texto: sabor.nombre })),
  );

  constructor() {
    void this.cargar();
  }

  protected async refrescar(): Promise<void> {
    try {
      this.lotes.set(
        await this.lotesService.listar({
          saborId: this.saborId() === '' ? undefined : this.saborId(),
          estado: this.estado() === '' ? undefined : (this.estado() as EstadoLote),
          limite: 200,
        }),
      );
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
