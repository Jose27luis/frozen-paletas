import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '../../generated/prisma/enums';

export class UsuarioDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Katerin' })
  nombres: string;

  @ApiProperty({ example: 'Huamán Soto' })
  apellidos: string;

  @ApiProperty({ example: 'katerin@frozen.pe' })
  correo: string;

  @ApiProperty({ enum: Rol, enumName: 'Rol' })
  rol: Rol;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
