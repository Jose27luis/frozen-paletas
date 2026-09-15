import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ORIGENES_MERMA, PERMISOS } from '../nucleo/etiquetas';
import { fechaCorta, hoyEnIso } from '../nucleo/formato';
import { MermasService } from '../nucleo/mermas.service';
import { CausaMerma, Lote, Merma, Sabor } from '../nucleo/modelos';
import { LotesService } from '../nucleo/lotes.service';
import { SaboresService } from '../nucleo/sabores.service';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';

@Component({
  selector: 'fz-mermas-pagina',
  imports: [Boton, Campo, CampoNumero, CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Mermas</h1>
    <p class="pt-1 text-sm text-tenue">
      Aquí se registra el producto que ya estaba en almacén. La merma del embolsado se anota al
      cerrar la producción.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-8 lg:grid-cols-[22rem_1fr]">
        @if (puedeRegistrar()) {
          <form class="lamina h-fit p-6" (submit)="registrar($event)">
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
              <fz-campo-numero etiqueta="Paletas perdidas" [minimo]="1" [(valor)]="cantidad" />
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
              <fz-boton tipo="submit" [ocupado]="enviando()" [ancho]="true"
                >Registrar merma</fz-boton
              >
            </div>
          </form>
        }

        <div class="lamina min-w-0 overflow-x-auto">
          <table class="w-full min-w-[40rem]">
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
                <tr>
                  <td class="celda text-sm whitespace-nowrap">{{ fechaCorta(merma.fecha) }}</td>
                  <td class="celda text-sm">{{ merma.sabor }}</td>
                  <td class="celda text-sm text-tenue">{{ merma.lote ?? '—' }}</td>
                  <td class="celda text-sm">{{ merma.causa }}</td>
                  <td class="celda">
                    <fz-chip [tono]="merma.descontoStock ? 'granate' : 'neutro'">{{
                      ORIGENES_MERMA[merma.origen]
                    }}</fz-chip>
                  </td>
                  <td class="celda cifra text-right text-sm">{{ merma.cantidad }}</td>
                </tr>
              } @empty {
                <tr>
                  <td class="celda text-sm text-tenue" colspan="6">Sin mermas registradas.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class MermasPagina {
  private readonly mermasService = inject(MermasService);
  private readonly saboresService = inject(SaboresService);
  private readonly lotesService = inject(LotesService);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly mermas = signal<Merma[]>([]);
  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly causas = signal<CausaMerma[]>([]);
  protected readonly lotes = signal<Lote[]>([]);
  protected readonly cargando = signal(true);

  protected readonly saborId = signal('');
  protected readonly cantidad = signal<number | null>(null);
  protected readonly causaId = signal('');
  protected readonly loteId = signal('');
  protected readonly observacion = signal('');
  protected readonly fecha = signal(hoyEnIso());
  protected readonly enviando = signal(false);

  protected readonly ORIGENES_MERMA = ORIGENES_MERMA;
  protected readonly fechaCorta = fechaCorta;

  protected readonly puedeRegistrar = computed(() => this.sesion.puede(PERMISOS.REGISTRAR_MERMAS));

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

  protected readonly opcionesDeLote = computed<Opcion[]>(() =>
    this.lotes()
      .filter((lote) => lote.saborId === this.saborId())
      .map((lote) => ({ valor: lote.id, texto: `${lote.codigo} (quedan ${lote.stockRestante})` })),
  );

  constructor() {
    void this.cargar();
  }

  protected cambiarSabor(valor: string): void {
    this.saborId.set(valor);
    this.loteId.set('');
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
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.enviando.set(false);
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
    const [mermas, lotes] = await Promise.all([
      this.mermasService.listar({ limite: 50 }),
      this.lotesService.listar({ conStock: true, limite: 200 }),
    ]);

    this.mermas.set(mermas);
    this.lotes.set(lotes);
  }
}
