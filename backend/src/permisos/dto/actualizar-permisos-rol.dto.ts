import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn, IsString } from 'class-validator';
import { CATALOGO_PERMISOS, ClavePermiso } from '../claves';

const CLAVES = CATALOGO_PERMISOS.map((permiso) => permiso.clave);

export class ActualizarPermisosRolDto {
  @ApiProperty({
    isArray: true,
    enum: CLAVES,
    example: ['inventario.consultar', 'produccion.registrar'],
    description: 'Lista completa de permisos que queda concedida al rol',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(CLAVES, { each: true })
  claves: ClavePermiso[];
}
