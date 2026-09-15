import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { CATEGORIAS, ESTADOS_STOCK, TIPOS_MOVIMIENTO } from '../nucleo/etiquetas';
import { fechaCorta } from '../nucleo/formato';
import { InventarioService } from '../nucleo/inventario.service';
import { EstadoStock, Inventario, Movimiento } from '../nucleo/modelos';
import { Cargador } from '../ui/cargador';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Chip, TonoChip } from '../ui/chip';

const TONOS: Readonly<Record<EstadoStock, TonoChip>> = {
  DISPONIBLE: 'hoja',
  REPONER: 'aguaje',
  AGOTADO: 'granate',
};

@Component({
  selector: 'fz-inventario-pagina',
  imports: [Cargador, CampoSeleccion, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Inventario</h1>
    <p class="pt-1 text-sm text-tenue">
      El stock sale de sumar los movimientos de cada sabor, no de un contador aparte.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else if (inventario(); as datos) {
      <div class="lamina mt-8 overflow-x-auto">
        <table class="w-full min-w-[34rem]">
          <thead>
            <tr>
              <th class="encabezado-tabla">Sabor</th>
              <th class="encabezado-tabla">Categoría</th>
              <th class="encabezado-tabla text-right">Stock</th>
              <th class="encabezado-tabla text-right">Mínimo</th>
              <th class="encabezado-tabla">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (sabor of datos.sabores; track sabor.saborId) {
              <tr>
                <td class="celda">
                  <span class="block text-sm">{{ sabor.nombre }}</span>
                  <span class="text-xs text-tenue">{{ sabor.abreviatura }}</span>
                </td>
                <td class="celda text-sm text-tenue">{{ CATEGORIAS[sabor.categoria] }}</td>
                <td class="celda cifra text-right text-lg">{{ sabor.stock }}</td>
                <td class="celda text-right text-sm text-tenue">{{ sabor.stockMinimo }}</td>
                <td class="celda">
                  <fz-chip [tono]="TONOS[sabor.estado]">{{ ESTADOS_STOCK[sabor.estado] }}</fz-chip>
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td class="celda text-sm font-medium" colspan="2">Total</td>
              <td class="celda cifra text-right text-lg">{{ datos.total }}</td>
              <td class="celda" colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <section class="pt-12">
        <h2 class="titulo text-lg">Movimientos</h2>
        <p class="pb-5 text-sm text-tenue">Cada entrada y cada salida que formó el stock actual.</p>

        <div class="max-w-xs pb-5">
          <fz-campo-seleccion
            etiqueta="Sabor"
            vacio="Todos los sabores"
            [opciones]="opcionesDeSabor()"
            [(valor)]="saborElegido"
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
                <tr>
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
                    Todavía no hay movimientos con ese filtro.
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
  private readonly avisos = inject(AvisosService);

  protected readonly inventario = signal<Inventario | null>(null);
  protected readonly movimientos = signal<Movimiento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly saborElegido = signal('');

  protected readonly CATEGORIAS = CATEGORIAS;
  protected readonly ESTADOS_STOCK = ESTADOS_STOCK;
  protected readonly TIPOS_MOVIMIENTO = TIPOS_MOVIMIENTO;
  protected readonly TONOS = TONOS;
  protected readonly fechaCorta = fechaCorta;

  protected readonly opcionesDeSabor = computed<Opcion[]>(
    () =>
      this.inventario()?.sabores.map((sabor) => ({
        valor: sabor.saborId,
        texto: sabor.nombre,
      })) ?? [],
  );

  constructor() {
    void this.cargar();
  }

  protected async cargarMovimientos(): Promise<void> {
    const saborId = this.saborElegido();

    try {
      this.movimientos.set(
        await this.inventarioService.movimientos({
          saborId: saborId === '' ? undefined : saborId,
        }),
      );
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
