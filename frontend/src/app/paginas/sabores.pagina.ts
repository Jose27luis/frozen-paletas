import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { CATEGORIAS, ESTADOS_SABOR, PERMISOS } from '../nucleo/etiquetas';
import { haceDias, hoyEnIso, miles, soles } from '../nucleo/formato';
import { Indicadores, IndicadorSabor } from '../nucleo/indicadores';
import { CategoriaSabor, EstadoSabor, Sabor } from '../nucleo/modelos';
import { PanelService } from '../nucleo/panel.service';
import { SaboresService } from '../nucleo/sabores.service';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip, TonoChip } from '../ui/chip';
import { Icono } from '../ui/icono';

const DIAS_DE_CONTEXTO = 30;

const OPCIONES_CATEGORIA: readonly Opcion[] = (Object.keys(CATEGORIAS) as CategoriaSabor[]).map(
  (categoria) => ({ valor: categoria, texto: CATEGORIAS[categoria] }),
);

const OPCIONES_ESTADO: readonly Opcion[] = (Object.keys(ESTADOS_SABOR) as EstadoSabor[]).map(
  (estado) => ({ valor: estado, texto: ESTADOS_SABOR[estado] }),
);

const TONOS: Readonly<Record<EstadoSabor, TonoChip>> = {
  ACTIVO: 'hoja',
  PROXIMO: 'helado',
  INACTIVO: 'neutro',
};

@Component({
  selector: 'fz-sabores-pagina',
  imports: [Boton, Campo, CampoNumero, CampoSeleccion, Cargador, Chip, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Sabores</h1>
    <p class="pt-1 text-sm text-tenue">
      El stock mínimo de cada sabor es lo que dispara las alertas de reposición.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado-hondo"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-7 lg:grid-cols-[22rem_1fr]">
        @if (puedeAdministrar()) {
          <form class="lamina h-fit p-6" (submit)="crear($event)">
            <h2 class="titulo text-base">Añadir sabor</h2>

            <div class="space-y-4 pt-5">
              <fz-campo etiqueta="Nombre" [(valor)]="nombre" />
              <fz-campo
                etiqueta="Abreviatura"
                ayuda="Tres letras; encabeza el código de lote."
                [(valor)]="abreviatura"
              />
              <fz-campo-seleccion
                etiqueta="Categoría"
                vacio="Elige una categoría"
                [opciones]="OPCIONES_CATEGORIA"
                [(valor)]="categoria"
              />
              <fz-campo-seleccion
                etiqueta="Estado"
                ayuda="Próximo se produce pero no genera alertas."
                [opciones]="OPCIONES_ESTADO"
                [(valor)]="estado"
              />
              <fz-campo-numero
                etiqueta="Stock mínimo"
                ayuda="Por debajo de este número pide reposición."
                [(valor)]="stockMinimo"
              />
              <fz-campo-numero
                etiqueta="Precio por paleta"
                ayuda="Se propone al registrar una salida. Admite decimales."
                [paso]="0.01"
                [(valor)]="precio"
              />
            </div>

            <div class="pt-6">
              <fz-boton tipo="submit" [ocupado]="enviando()" [ancho]="true">Añadir sabor</fz-boton>
            </div>
          </form>
        }

        <div class="min-w-0 space-y-8">
          @for (grupo of agrupados(); track grupo.categoria) {
            <section>
              <h2 class="titulo text-lg">{{ CATEGORIAS[grupo.categoria] }}</h2>
              <p class="pb-3 text-sm text-tenue">{{ grupo.sabores.length }} sabores</p>

              <ul class="space-y-2">
                @for (sabor of grupo.sabores; track sabor.id) {
                  <li class="lamina overflow-hidden">
                    <button
                      type="button"
                      class="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-hundido/50"
                      [attr.aria-expanded]="abierto() === sabor.id"
                      (click)="alternar(sabor)"
                    >
                      <span class="min-w-0 flex-1">
                        <span class="flex flex-wrap items-baseline gap-x-2">
                          <span class="text-sm text-tinta">{{ sabor.nombre }}</span>
                          <span class="cifra text-xs text-tenue">{{ sabor.abreviatura }}</span>
                        </span>
                        <span class="flex flex-wrap items-baseline gap-x-3 pt-1 text-xs text-tenue">
                          <span>mínimo {{ sabor.stockMinimo }}</span>
                          @if (sabor.precio !== null) {
                            <span class="text-tinta">{{ soles(sabor.precio) }} por paleta</span>
                          } @else {
                            <span>sin precio</span>
                          }
                          @if (contexto(sabor.id); as datos) {
                            <span>{{ datos.stock }} en stock</span>
                            <span>{{ datos.salido }} salieron en {{ DIAS_DE_CONTEXTO }} días</span>
                            @if (datos.cobertura !== null) {
                              <span>aguanta {{ datos.cobertura }} días</span>
                            }
                          }
                        </span>
                      </span>

                      <span class="shrink-0">
                        <fz-chip [tono]="TONOS[sabor.estado]">{{
                          ESTADOS_SABOR[sabor.estado]
                        }}</fz-chip>
                      </span>

                      @if (puedeAdministrar()) {
                        <span
                          class="shrink-0 text-tenue transition-transform duration-300"
                          [class.rotate-90]="abierto() === sabor.id"
                          aria-hidden="true"
                        >
                          <fz-icono nombre="desplegar" />
                        </span>
                      }
                    </button>

                    @if (puedeAdministrar()) {
                      <div
                        class="grid transition-[grid-template-rows] duration-300 ease-out"
                        [class]="abierto() === sabor.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                      >
                        <div class="overflow-hidden">
                          <form class="border-t border-linea p-4" (submit)="guardar($event)">
                            <div class="grid gap-4 sm:grid-cols-2">
                              <fz-campo etiqueta="Nombre" [(valor)]="editNombre" />
                              <fz-campo etiqueta="Abreviatura" [(valor)]="editAbreviatura" />
                              <fz-campo-seleccion
                                etiqueta="Categoría"
                                [opciones]="OPCIONES_CATEGORIA"
                                [(valor)]="editCategoria"
                              />
                              <fz-campo-seleccion
                                etiqueta="Estado"
                                [opciones]="OPCIONES_ESTADO"
                                [(valor)]="editEstado"
                              />
                              <fz-campo-numero
                                etiqueta="Stock mínimo"
                                [ayuda]="sugerencia(sabor.id)"
                                [(valor)]="editStockMinimo"
                              />
                              <fz-campo-numero
                                etiqueta="Precio por paleta"
                                ayuda="Vacío para que no se proponga ninguno."
                                [paso]="0.01"
                                [(valor)]="editPrecio"
                              />
                            </div>

                            <div class="flex flex-wrap gap-3 pt-5">
                              <fz-boton tipo="submit" [ocupado]="guardando()"
                                >Guardar cambios</fz-boton
                              >
                              <fz-boton tono="fantasma" (click)="abierto.set(null)"
                                >Cancelar</fz-boton
                              >
                            </div>
                          </form>
                        </div>
                      </div>
                    }
                  </li>
                }
              </ul>
            </section>
          }
        </div>
      </div>
    }
  `,
})
export class SaboresPagina {
  private readonly saboresService = inject(SaboresService);
  private readonly panelService = inject(PanelService);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly indicadores = signal<Indicadores | null>(null);
  protected readonly cargando = signal(true);

  protected readonly nombre = signal('');
  protected readonly abreviatura = signal('');
  protected readonly categoria = signal('');
  protected readonly estado = signal<string>('ACTIVO');
  protected readonly stockMinimo = signal<number | null>(80);
  protected readonly precio = signal<number | null>(null);
  protected readonly enviando = signal(false);

  protected readonly abierto = signal<string | null>(null);
  protected readonly editNombre = signal('');
  protected readonly editAbreviatura = signal('');
  protected readonly editCategoria = signal('');
  protected readonly editEstado = signal('');
  protected readonly editStockMinimo = signal<number | null>(null);
  protected readonly editPrecio = signal<number | null>(null);
  protected readonly guardando = signal(false);

  protected readonly CATEGORIAS = CATEGORIAS;
  protected readonly ESTADOS_SABOR = ESTADOS_SABOR;
  protected readonly OPCIONES_CATEGORIA = OPCIONES_CATEGORIA;
  protected readonly OPCIONES_ESTADO = OPCIONES_ESTADO;
  protected readonly TONOS = TONOS;
  protected readonly DIAS_DE_CONTEXTO = DIAS_DE_CONTEXTO;
  protected readonly miles = miles;
  protected readonly soles = soles;

  protected readonly puedeAdministrar = computed(() =>
    this.sesion.puede(PERMISOS.ADMINISTRAR_SABORES),
  );

  protected readonly agrupados = computed(() => {
    const categorias = Object.keys(CATEGORIAS) as CategoriaSabor[];

    return categorias
      .map((categoria) => ({
        categoria,
        sabores: this.sabores().filter((sabor) => sabor.categoria === categoria),
      }))
      .filter((grupo) => grupo.sabores.length > 0);
  });

  constructor() {
    void this.cargar();
  }

  protected contexto(saborId: string): IndicadorSabor | null {
    return this.indicadores()?.sabores.find((fila) => fila.saborId === saborId) ?? null;
  }

  protected sugerencia(saborId: string): string {
    const datos = this.contexto(saborId);

    if (datos === null || datos.salido === 0) {
      return 'Sin salidas registradas todavía, no hay con qué calcularlo.';
    }

    const diario = datos.salido / DIAS_DE_CONTEXTO;
    const paraTresDias = Math.max(1, Math.ceil(diario * 3));

    return `Salen unas ${diario.toFixed(1)} al día; tres días de colchón serían ${paraTresDias}.`;
  }

  protected alternar(sabor: Sabor): void {
    if (!this.puedeAdministrar() || this.abierto() === sabor.id) {
      this.abierto.set(null);
      return;
    }

    this.abierto.set(sabor.id);
    this.editNombre.set(sabor.nombre);
    this.editAbreviatura.set(sabor.abreviatura);
    this.editCategoria.set(sabor.categoria);
    this.editEstado.set(sabor.estado);
    this.editStockMinimo.set(sabor.stockMinimo);
    this.editPrecio.set(sabor.precio === null ? null : Number(sabor.precio));
  }

  protected async crear(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.nombre() === '' || this.abreviatura() === '' || this.categoria() === '') {
      this.avisos.error('Completa el nombre, la abreviatura y la categoría.');
      return;
    }

    this.enviando.set(true);

    try {
      await this.saboresService.crear({
        nombre: this.nombre(),
        abreviatura: this.abreviatura(),
        categoria: this.categoria() as CategoriaSabor,
        estado: this.estado() as EstadoSabor,
        stockMinimo: this.stockMinimo() ?? undefined,
        precio: this.precio() ?? undefined,
      });

      this.avisos.exito('Sabor añadido al catálogo.');
      this.nombre.set('');
      this.abreviatura.set('');
      this.categoria.set('');
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.enviando.set(false);
    }
  }

  protected async guardar(evento: Event): Promise<void> {
    evento.preventDefault();

    const id = this.abierto();

    if (id === null) {
      return;
    }

    this.guardando.set(true);

    try {
      const guardado = await this.saboresService.actualizar(id, {
        nombre: this.editNombre(),
        abreviatura: this.editAbreviatura(),
        categoria: this.editCategoria() as CategoriaSabor,
        estado: this.editEstado() as EstadoSabor,
        stockMinimo: this.editStockMinimo() ?? undefined,
        precio: this.editPrecio() ?? undefined,
      });

      this.avisos.exito(`${guardado.nombre} quedó actualizado.`);
      this.abierto.set(null);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.guardando.set(false);
    }
  }

  private async refrescar(): Promise<void> {
    this.sabores.set(await this.saboresService.listar());
  }

  private async cargar(): Promise<void> {
    try {
      const [sabores, indicadores] = await Promise.all([
        this.saboresService.listar(),
        this.panelService.indicadores(haceDias(DIAS_DE_CONTEXTO), hoyEnIso()),
      ]);

      this.sabores.set(sabores);
      this.indicadores.set(indicadores);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
