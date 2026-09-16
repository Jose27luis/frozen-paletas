import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AvisosService } from '../nucleo/avisos.service';
import { mensajeDe } from '../nucleo/errores';
import { ROLES } from '../nucleo/etiquetas';
import { Permiso, Rol, Usuario } from '../nucleo/modelos';
import { SesionService } from '../nucleo/sesion.service';
import { UsuariosService } from '../nucleo/usuarios.service';
import { Boton } from '../ui/boton';
import { Campo } from '../ui/campo';
import { CampoSeleccion, Opcion } from '../ui/campo-seleccion';
import { Cargador } from '../ui/cargador';
import { Chip } from '../ui/chip';
import { Icono } from '../ui/icono';

const ROLES_EDITABLES: readonly Rol[] = ['OPERACIONES', 'PRODUCCION', 'CONSULTA'];

const OPCIONES_ROL: readonly Opcion[] = (Object.keys(ROLES) as Rol[]).map((rol) => ({
  valor: rol,
  texto: ROLES[rol],
}));

@Component({
  selector: 'fz-usuarios-pagina',
  imports: [Boton, Campo, CampoSeleccion, Cargador, Chip, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo text-2xl">Usuarios y permisos</h1>
    <p class="pt-1 text-sm text-tenue">
      Los permisos viven en la base de datos: cambiarlos no obliga a recompilar nada.
    </p>

    @if (cargando()) {
      <div class="flex justify-center py-20 text-helado-hondo"><fz-cargador /></div>
    } @else {
      <div class="grid gap-8 pt-7 lg:grid-cols-[22rem_1fr]">
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
          <section>
            <h2 class="titulo text-lg">Quién entra al sistema</h2>
            <p class="pb-3 text-sm text-tenue">
              Abre un usuario para corregir sus datos, cambiarle el rol o darle una contraseña
              nueva.
            </p>

            <ul class="space-y-2">
              @for (usuario of usuarios(); track usuario.id) {
                <li class="lamina overflow-hidden">
                  <button
                    type="button"
                    class="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-hundido/50"
                    [attr.aria-expanded]="abierto() === usuario.id"
                    (click)="alternar(usuario)"
                  >
                    <span
                      class="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium"
                      [class]="
                        usuario.activo ? 'bg-helado-hondo text-superficie' : 'bg-hundido text-tenue'
                      "
                      aria-hidden="true"
                      >{{ iniciales(usuario) }}</span
                    >

                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm"
                        >{{ usuario.nombres }} {{ usuario.apellidos }}</span
                      >
                      <span class="block truncate text-xs text-tenue">{{ usuario.correo }}</span>
                    </span>

                    <span class="shrink-0">
                      <fz-chip [tono]="usuario.activo ? 'helado' : 'neutro'">{{
                        ROLES[usuario.rol]
                      }}</fz-chip>
                    </span>

                    <span
                      class="shrink-0 text-tenue transition-transform duration-300"
                      [class.rotate-90]="abierto() === usuario.id"
                      aria-hidden="true"
                    >
                      <fz-icono nombre="desplegar" />
                    </span>
                  </button>

                  <div
                    class="grid transition-[grid-template-rows] duration-300 ease-out"
                    [class]="abierto() === usuario.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                  >
                    <div class="overflow-hidden">
                      <div class="border-t border-linea p-4">
                        <form (submit)="guardar($event)">
                          <div class="grid gap-4 sm:grid-cols-2">
                            <fz-campo etiqueta="Nombres" [(valor)]="editNombres" />
                            <fz-campo etiqueta="Apellidos" [(valor)]="editApellidos" />
                            <fz-campo etiqueta="Correo" tipo="email" [(valor)]="editCorreo" />
                            <fz-campo-seleccion
                              etiqueta="Rol"
                              [opciones]="OPCIONES_ROL"
                              [(valor)]="editRol"
                            />
                            <fz-campo
                              etiqueta="Contraseña nueva"
                              tipo="password"
                              ayuda="Déjala vacía para no cambiarla."
                              [(valor)]="editPassword"
                            />
                          </div>

                          <div class="flex flex-wrap gap-3 pt-5">
                            <fz-boton tipo="submit" [ocupado]="guardando()"
                              >Guardar cambios</fz-boton
                            >
                            @if (usuario.activo) {
                              <fz-boton tono="alerta" (click)="desactivar(usuario)"
                                >Quitar el acceso</fz-boton
                              >
                            } @else {
                              <fz-boton tono="contorno" (click)="reactivar(usuario)"
                                >Devolver el acceso</fz-boton
                              >
                            }
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </li>
              }
            </ul>
          </section>

          <section>
            <h2 class="titulo text-lg">Qué puede hacer cada rol</h2>
            <p class="pb-4 text-sm text-tenue">
              Administración conserva todos los permisos y no se edita, para que nadie se quede
              fuera del sistema por error.
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
                    <tr class="transition-colors hover:bg-hundido/50">
                      <td class="celda">
                        <span class="block text-sm">{{ permiso.nombre }}</span>
                        <span class="text-xs text-tenue">{{ permiso.descripcion }}</span>
                      </td>
                      @for (rol of ROLES_EDITABLES; track rol) {
                        <td class="celda text-center">
                          <input
                            type="checkbox"
                            class="size-4 accent-[var(--color-helado-hondo)]"
                            [attr.aria-label]="permiso.nombre + ' para ' + ROLES[rol]"
                            [checked]="permiso.roles.includes(rol)"
                            [disabled]="guardandoPermisos()"
                            (change)="alternarPermiso(rol, permiso, $event)"
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
  private readonly sesion = inject(SesionService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly permisos = signal<Permiso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardandoPermisos = signal(false);

  protected readonly nombres = signal('');
  protected readonly apellidos = signal('');
  protected readonly correo = signal('');
  protected readonly password = signal('');
  protected readonly rol = signal('');
  protected readonly enviando = signal(false);

  protected readonly abierto = signal<string | null>(null);
  protected readonly editNombres = signal('');
  protected readonly editApellidos = signal('');
  protected readonly editCorreo = signal('');
  protected readonly editRol = signal('');
  protected readonly editPassword = signal('');
  protected readonly guardando = signal(false);

  protected readonly ROLES = ROLES;
  protected readonly ROLES_EDITABLES = ROLES_EDITABLES;
  protected readonly OPCIONES_ROL = OPCIONES_ROL;

  protected readonly propio = computed(() => this.sesion.usuario()?.id ?? '');

  constructor() {
    void this.cargar();
  }

  protected iniciales(usuario: Usuario): string {
    return `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase();
  }

  protected alternar(usuario: Usuario): void {
    if (this.abierto() === usuario.id) {
      this.abierto.set(null);
      return;
    }

    this.abierto.set(usuario.id);
    this.editNombres.set(usuario.nombres);
    this.editApellidos.set(usuario.apellidos);
    this.editCorreo.set(usuario.correo);
    this.editRol.set(usuario.rol);
    this.editPassword.set('');
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

    const password = this.editPassword();

    if (password !== '' && password.length < 8) {
      this.avisos.error('La contraseña nueva necesita al menos 8 caracteres.');
      return;
    }

    this.guardando.set(true);

    try {
      await this.usuariosService.actualizar(id, {
        nombres: this.editNombres(),
        apellidos: this.editApellidos(),
        correo: this.editCorreo(),
        rol: this.editRol() as Rol,
        password: password === '' ? undefined : password,
      });

      this.avisos.exito(
        password === '' ? 'Datos actualizados.' : 'Datos y contraseña actualizados.',
      );
      this.abierto.set(null);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async desactivar(usuario: Usuario): Promise<void> {
    if (usuario.id === this.propio()) {
      this.avisos.error('No puedes quitarte el acceso a ti mismo.');
      return;
    }

    try {
      await this.usuariosService.desactivar(usuario.id);
      this.avisos.exito(`${usuario.nombres} ya no puede entrar.`);
      this.abierto.set(null);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  protected async reactivar(usuario: Usuario): Promise<void> {
    try {
      await this.usuariosService.reactivar(usuario.id);
      this.avisos.exito(`${usuario.nombres} vuelve a tener acceso.`);
      this.abierto.set(null);
      await this.refrescar();
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
    }
  }

  protected async alternarPermiso(rol: Rol, permiso: Permiso, evento: Event): Promise<void> {
    const marcado = (evento.target as HTMLInputElement).checked;

    const claves = this.permisos()
      .filter((fila) => (fila.clave === permiso.clave ? marcado : fila.roles.includes(rol)))
      .map((fila) => fila.clave);

    this.guardandoPermisos.set(true);

    try {
      this.permisos.set(await this.usuariosService.guardarPermisos(rol, claves));
      this.avisos.exito(
        marcado
          ? `${ROLES[rol]} ya puede: ${permiso.nombre.toLowerCase()}`
          : `${ROLES[rol]} deja de poder: ${permiso.nombre.toLowerCase()}`,
      );
    } catch (error: unknown) {
      this.avisos.error(mensajeDe(error));
      this.permisos.set(await this.usuariosService.permisos());
    } finally {
      this.guardandoPermisos.set(false);
    }
  }

  private async refrescar(): Promise<void> {
    this.usuarios.set(await this.usuariosService.listar());
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
