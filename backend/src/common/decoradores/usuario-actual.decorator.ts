import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsuarioAutenticado } from '../tipos/usuario-autenticado';

export function resolverUsuarioActual(
  _dato: unknown,
  contexto: ExecutionContext,
): UsuarioAutenticado {
  const peticion = contexto
    .switchToHttp()
    .getRequest<Request & { user?: UsuarioAutenticado }>();

  if (!peticion.user) {
    throw new UnauthorizedException(
      'La petición no tiene un usuario autenticado',
    );
  }

  return peticion.user;
}

export const UsuarioActual = createParamDecorator(resolverUsuarioActual);
