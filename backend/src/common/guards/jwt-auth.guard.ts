import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { CLAVE_PUBLICO } from '../decoradores/publico.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    contexto: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean | undefined>(
      CLAVE_PUBLICO,
      [contexto.getHandler(), contexto.getClass()],
    );

    if (esPublico === true) {
      return true;
    }

    return super.canActivate(contexto);
  }
}
