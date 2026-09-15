import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ROLES } from '../nucleo/etiquetas';
import { Permiso, Rol, Usuario } from '../nucleo/modelos';
import { UsuariosService } from '../nucleo/usuarios.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';

const ROLES_EDITABLES: readonly Rol[] = ['OPERACIONES', 'PRODUCCION', 'CONSULTA'];

const OPCIONES_ROL: readonly Opcion[] = (Object.keys(ROLES) as Rol[]).map((rol) => ({
  valor: rol,
  texto: ROLES[rol],
}));

@Component({
  selector: 'fz-usuarios-pagina',
  imports: [Boton, Campo, CampoSeleccion, Cargador, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Usuarios y permisos</h1>
    <p class="pt-1 text-sm text-tenue">
      Los permisos se guardan en la base de datos: cambiarlos no obliga a recompilar la app.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-8 lg:grid-cols-[22rem_1fr]">
        <form class="lamina h-fit p-6" (submit)="crear($event)">
          <h2 class="titulo text-base">Dar de alta</h2>

          <div class="space-y-4 pt-5">
            <fz-campo etiqueta="Nombres" [(valor)]="nombres" />
            <fz-campo etiqueta="Apellidos" [(valor)]="apellidos" />
            <fz-campo etiqueta="Correo" tipo="email" [(valor)]="correo" />
            <fz-campo
              etiqueta="Contraseña"
              tipo="password"
              ayuda="Mínimo 8 caracteres."
              [(valor)]="password"
            />
            <fz-campo-seleccion
              etiqueta="Rol"
              vacio="Elige un rol"
              [opciones]="OPCIONES_ROL"
              [(valor)]="rol"
            />
          </div>

          <div class="pt-6">
            <fz-boton tipo="submit" [ocupado]="enviando()" [ancho]="true">Crear usuario</fz-boton>
          </div>
        </form>

        <div class="min-w-0 space-y-10">
          <div class="lamina overflow-x-auto">
            <table class="w-full min-w-[34rem]">
              <thead>
                <tr>
                  <th class="encabezado-tabla">Usuario</th>
                  <th class="encabezado-tabla">Correo</th>
                  <th class="encabezado-tabla">Rol</th>
                  <th class="encabezado-tabla"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                @for (usuario of usuarios(); track usuario.id) {
                  <tr>
                    <td class="celda text-sm">{{ usuario.nombres }} {{ usuario.apellidos }}</td>
                    <td class="celda text-sm text-tenue">{{ usuario.correo }}</td>
                    <td class="celda">
                      <fz-chip [tono]="usuario.activo ? 'helado' : 'neutro'">{{
                        ROLES[usuario.rol]
                      }}</fz-chip>
                    </td>
                    <td class="celda text-right">
                      @if (usuario.activo) {
                        <fz-boton tono="fantasma" (click)="desactivar(usuario)"
                          >Desactivar</fz-boton
                        >
                      } @else {
                        <fz-boton tono="fantasma" (click)="reactivar(usuario)">Reactivar</fz-boton>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <section>
            <h2 class="titulo text-lg">Qué puede hacer cada rol</h2>
            <p class="pb-4 text-sm text-tenue">
              Administración conserva todos los permisos y no se edita.
            </p>

            <div class="lamina overflow-x-auto">
              <table class="w-full min-w-[40rem]">
                <thead>
                  <tr>
                    <th class="encabezado-tabla">Permiso</th>
                    @for (rol of ROLES_EDITABLES; track rol) {
                      <th class="encabezado-tabla text-center">{{ ROLES[rol] }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (permiso of permisos(); track permiso.clave) {
                    <tr>
                      <td class="celda">
                        <span class="block text-sm">{{ permiso.nombre }}</span>
                        <span class="text-xs text-tenue">{{ permiso.descripcion }}</span>
                      </td>
                      @for (rol of ROLES_EDITABLES; track rol) {
                        <td class="celda text-center">
                          <input
                            type="checkbox"
                            class="size-4 accent-[var(--color-helado)]"
                            [attr.aria-label]="permiso.nombre + ' para ' + ROLES[rol]"
                            [checked]="permiso.roles.includes(rol)"
                            [disabled]="guardando()"
                            (change)="alternar(rol, permiso, $event)"
                          />
                        </td>
                      }
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
export class UsuariosPagina {
  private readonly usuariosService = inject(UsuariosService);
  private readonly avisos = inject(AvisosService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly permisos = signal<Permiso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);

  protected readonly nombres = signal('');
  protected readonly apellidos = signal('');
  protected readonly correo = signal('');
  protected readonly password = signal('');
  protected readonly rol = signal('');
  protected readonly enviando = signal(false);

  protected readonly ROLES = ROLES;
  protected readonly ROLES_EDITABLES = ROLES_EDITABLES;
  protected readonly OPCIONES_ROL = OPCIONES_ROL;

  constructor() {
    void this.cargar();
  }

  protected async crear(evento: Event): Promise<void> {
    evento.preventDefault();

    if (this.correo() === '' || this.password() === '' || this.rol() === '') {
      this.avisos.error('Completa el correo, la contraseña y el rol.');
      return;
    }

    this.enviando.set(true);

    try {
      await this.usuariosService.crear({
        nombres: this.nombres(),
        apellidos: this.apellidos(),
        correo: this.correo(),
        password: this.password(),
        rol: this.rol() as Rol,
      });

      this.avisos.exito('Usuario creado.');
      this.nombres.set('');
      this.apellidos.set('');
      this.correo.set('');
      this.password.set('');
      this.rol.set('');
      this.usuarios.set(await this.usuariosService.listar());
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.enviando.set(false);
    }
  }

  protected async desactivar(usuario: Usuario): Promise<void> {
    try {
      await this.usuariosService.desactivar(usuario.id);
      this.usuarios.set(await this.usuariosService.listar());
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  protected async reactivar(usuario: Usuario): Promise<void> {
    try {
      await this.usuariosService.reactivar(usuario.id);
      this.usuarios.set(await this.usuariosService.listar());
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  protected async alternar(rol: Rol, permiso: Permiso, evento: Event): Promise<void> {
    const marcado = (evento.target as HTMLInputElement).checked;

    const claves = this.permisos()
      .filter((fila) => (fila.clave === permiso.clave ? marcado : fila.roles.includes(rol)))
      .map((fila) => fila.clave);

    this.guardando.set(true);

    try {
      this.permisos.set(await this.usuariosService.guardarPermisos(rol, claves));
      this.avisos.exito(`Permisos de ${ROLES[rol]} actualizados.`);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
      this.permisos.set(await this.usuariosService.permisos());
    } finally {
      this.guardando.set(false);
    }
  }

  private async cargar(): Promise<void> {
    try {
      const [usuarios, permisos] = await Promise.all([
        this.usuariosService.listar(),
        this.usuariosService.permisos(),
      ]);

      this.usuarios.set(usuarios);
      this.permisos.set(permisos);
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.cargando.set(false);
    }
  }
}
