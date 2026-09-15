import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AntifuerzaBrutaGuard extends ThrottlerGuard {
  protected getTracker(peticion: Record<string, unknown>): Promise<string> {
    const cuerpo: unknown = peticion.body;

    if (
      typeof cuerpo === 'object' &&
      cuerpo !== null &&
      'correo' in cuerpo &&
      typeof cuerpo.correo === 'string' &&
      cuerpo.correo.trim() !== ''
    ) {
      return Promise.resolve(`correo:${cuerpo.correo.trim().toLowerCase()}`);
    }

    return Promise.resolve(
      `ip:${typeof peticion.ip === 'string' ? peticion.ip : 'desconocida'}`,
    );
  }

  protected getErrorMessage(): Promise<string> {
    return Promise.resolve(
      'Demasiados intentos de inicio de sesión. Espera un minuto antes de volver a probar.',
    );
  }
}
