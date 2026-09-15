import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { CATEGORIAS, ESTADOS_SABOR, PERMISOS } from '../nucleo/etiquetas';
import { CategoriaSabor, Sabor } from '../nucleo/modelos';
import { SaboresService } from '../nucleo/sabores.service';
import { SesionService } from '../nucleo/sesion.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoNumero } from '../ui/campo-numero';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';

const OPCIONES_CATEGORIA: readonly Opcion[] = (Object.keys(CATEGORIAS) as CategoriaSabor[]).map(
  (categoria) => ({ valor: categoria, texto: CATEGORIAS[categoria] }),
);

@Component({
  selector: 'fz-sabores-pagina',
  imports: [Boton, Campo, CampoNumero, CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Sabores</h1>
    <p class="pt-1 text-sm text-tenue">
      Solo los sabores activos entran en las alertas de reposición.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-8 lg:grid-cols-[22rem_1fr]">
        @if (puedeAdministrar()) {
          <form class="lamina h-fit p-6" (submit)="crear($event)">
            <h2 class="titulo text-base">Añadir sabor</h2>

            <div class="space-y-4 pt-5">
              <fz-campo etiqueta="Nombre" [(valor)]="nombre" />
              <fz-campo
                etiqueta="Abreviatura"
                ayuda="Tres letras; es lo que encabeza el código de lote."
                [(valor)]="abreviatura"
              />
              <fz-campo-seleccion
                etiqueta="Categoría"
                vacio="Elige una categoría"
                [opciones]="OPCIONES_CATEGORIA"
                [(valor)]="categoria"
              />
              <fz-campo-numero
                etiqueta="Stock mínimo"
                ayuda="Por debajo de este número el sabor pide reposición."
                [(valor)]="stockMinimo"
              />
            </div>

            <div class="pt-6">
              <fz-boton tipo="submit" [ocupado]="enviando()" [ancho]="true">Añadir sabor</fz-boton>
            </div>
          </form>
        }

        <div class="lamina min-w-0 overflow-x-auto">
          <table class="w-full min-w-[36rem]">
            <thead>
              <tr>
                <th class="encabezado-tabla">Sabor</th>
                <th class="encabezado-tabla">Categoría</th>
                <th class="encabezado-tabla text-right">Mínimo</th>
                <th class="encabezado-tabla">Estado</th>
                @if (puedeAdministrar()) {
                  <th class="encabezado-tabla"><span class="sr-only">Acciones</span></th>
                }
              </tr>
            </thead>
            <tbody>
              @for (sabor of sabores(); track sabor.id) {
                <tr>
                  <td class="celda">
                    <span class="block text-sm">{{ sabor.nombre }}</span>
                    <span class="text-xs text-tenue">{{ sabor.abreviatura }}</span>
                  </td>
                  <td class="celda text-sm text-tenue">{{ CATEGORIAS[sabor.categoria] }}</td>
                  <td class="celda cifra text-right text-sm">{{ sabor.stockMinimo }}</td>
                  <td class="celda">
                    <fz-chip [tono]="sabor.estado === 'ACTIVO' ? 'hoja' : 'neutro'">{{
                      ESTADOS_SABOR[sabor.estado]
                    }}</fz-chip>
                  </td>
                  @if (puedeAdministrar()) {
                    <td class="celda text-right">
                      @if (sabor.estado === 'INACTIVO') {
                        <fz-boton tono="fantasma" (click)="activar(sabor)">Reactivar</fz-boton>
                      } @else {
                        <fz-boton tono="fantasma" (click)="desactivar(sabor)">Desactivar</fz-boton>
                      }
                    </td>
                  }
                </tr>
              } @empty {
                <tr>
                  <td class="celda text-sm text-tenue" colspan="5">El catálogo está vacío.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class SaboresPagina {
  private readonly saboresService = inject(SaboresService);
  private readonly avisos = inject(AvisosService);
  private readonly sesion = inject(SesionService);

  protected readonly sabores = signal<Sabor[]>([]);
  protected readonly cargando = signal(true);

  protected readonly nombre = signal('');
  protected readonly abreviatura = signal('');
  protected readonly categoria = signal('');
  protected readonly stockMinimo = signal<number | null>(80);
  protected readonly enviando = signal(false);

  protected readonly CATEGORIAS = CATEGORIAS;
  protected readonly ESTADOS_SABOR = ESTADOS_SABOR;
  protected readonly OPCIONES_CATEGORIA = OPCIONES_CATEGORIA;

  protected readonly puedeAdministrar = computed(() =>
    this.sesion.puede(PERMISOS.ADMINISTRAR_SABORES),
  );

  constructor() {
    void this.cargar();
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
        stockMinimo: this.stockMinimo() ?? undefined,
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

  protected async desactivar(sabor: Sabor): Promise<void> {
    try {
      await this.saboresService.desactivar(sabor.id);
      this.avisos.exito(`${sabor.nombre} queda fuera de las alertas.`);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  protected async activar(sabor: Sabor): Promise<void> {
    try {
      await this.saboresService.activar(sabor.id);
      this.avisos.exito(`${sabor.nombre} vuelve a producción.`);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  private async cargar(): Promise<void> {
    await this.refrescar();
    this.cargando.set(false);
  }

  private async refrescar(): Promise<void> {
    try {
      this.sabores.set(await this.saboresService.listar());
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }
}
