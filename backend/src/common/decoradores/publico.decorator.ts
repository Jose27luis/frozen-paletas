import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const CLAVE_PUBLICO = 'esPublico';

export const Publico = (): CustomDecorator<string> =>
  SetMetadata(CLAVE_PUBLICO, true);
