import { BadRequestException, Injectable } from '@nestjs/common';
import { Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CATALOGO_PERMISOS, ClavePermiso } from './claves';
import { PermisoDto } from './dto/permiso.dto';

@Injectable()
export class PermisosService {
  private readonly cache = new Map<Rol, Set<ClavePermiso>>();

  constructor(private readonly prisma: PrismaService) {}

  async clavesDelRol(rol: Rol): Promise<Set<ClavePermiso>> {
    const enCache = this.cache.get(rol);

    if (enCache !== undefined) {
      return enCache;
    }

    const concedidos = await this.prisma.rolPermiso.findMany({
      where: { rol },
      select: { permiso: { select: { clave: true } } },
    });

    const claves = new Set(
      concedidos.map((concedido) => concedido.permiso.clave as ClavePermiso),
    );

    this.cache.set(rol, claves);

    return claves;
  }

  async listar(): Promise<PermisoDto[]> {
    const concedidos = await this.prisma.rolPermiso.findMany({
      select: { rol: true, permiso: { select: { clave: true } } },
    });

    return CATALOGO_PERMISOS.map((permiso) => ({
      clave: permiso.clave,
      nombre: permiso.nombre,
      descripcion: permiso.descripcion,
      roles: concedidos
        .filter((concedido) => concedido.permiso.clave === permiso.clave)
        .map((concedido) => concedido.rol),
    }));
  }

  async actualizarRol(rol: Rol, claves: ClavePermiso[]): Promise<PermisoDto[]> {
    if (rol === Rol.ADMIN) {
      throw new BadRequestException(
        'El rol de administrador conserva todos los permisos y no se edita',
      );
    }

    const permisos = await this.prisma.permiso.findMany({
      where: { clave: { in: claves } },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.rolPermiso.deleteMany({ where: { rol } }),
      this.prisma.rolPermiso.createMany({
        data: permisos.map((permiso) => ({ rol, permisoId: permiso.id })),
      }),
    ]);

    this.cache.delete(rol);

    return this.listar();
  }
}
