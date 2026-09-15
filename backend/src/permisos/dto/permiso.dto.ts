import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '../../generated/prisma/enums';

export class PermisoDto {
  @ApiProperty({ example: 'produccion.registrar' })
  clave: string;

  @ApiProperty({ example: 'Registrar producción y embolsado' })
  nombre: string;

  @ApiProperty({
    example: 'Anotar lo producido y la cantidad final apta para venta',
  })
  descripcion: string;

  @ApiProperty({
    enum: Rol,
    enumName: 'Rol',
    isArray: true,
    description: 'Roles que tienen concedido el permiso',
  })
  roles: Rol[];
}
