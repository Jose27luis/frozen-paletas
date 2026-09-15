import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ClavePermiso } from '../../permisos/claves';
import { PermisosService } from '../../permisos/permisos.service';
import { CLAVE_PERMISO } from '../decoradores/permiso.decorator';
import { UsuarioAutenticado } from '../tipos/usuario-autenticado';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permisosService: PermisosService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const claves = this.reflector.getAllAndOverride<ClavePermiso[] | undefined>(
      CLAVE_PERMISO,
      [contexto.getHandler(), contexto.getClass()],
    );

    if (claves === undefined || claves.length === 0) {
      return true;
    }

    const peticion = contexto
      .switchToHttp()
      .getRequest<Request & { user?: UsuarioAutenticado }>();
    const actor = peticion.user;

    if (actor === undefined) {
      throw new ForbiddenException('No tienes permiso para hacer esto');
    }

    const concedidos = await this.permisosService.clavesDelRol(actor.rol);

    if (claves.some((clave) => concedidos.has(clave))) {
      return true;
    }

    throw new ForbiddenException(
      'Tu rol no tiene concedido este permiso. Pídeselo al administrador.',
    );
  }
}
