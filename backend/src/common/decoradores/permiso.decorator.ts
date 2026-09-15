import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { ClavePermiso } from '../../permisos/claves';

export const CLAVE_PERMISO = 'permisoRequerido';

export const RequierePermiso = (
  ...claves: ClavePermiso[]
): CustomDecorator<string> => SetMetadata(CLAVE_PERMISO, claves);
