import { ConfigService } from '@nestjs/config';

export function origenesPermitidos(configuracion: ConfigService): string[] {
  return configuracion
    .getOrThrow<string>('ORIGENES_PERMITIDOS')
    .split(',')
    .map((origen) => origen.trim())
    .filter((origen) => origen !== '');
}
