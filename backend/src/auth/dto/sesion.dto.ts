import { ApiProperty } from '@nestjs/swagger';
import { Rol } from '../../generated/prisma/enums';

export class UsuarioSesionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Darwin' })
  nombres: string;

  @ApiProperty({ example: 'Quispe Mamani' })
  apellidos: string;

  @ApiProperty({ example: 'darwin@frozen.pe' })
  correo: string;

  @ApiProperty({ enum: Rol, enumName: 'Rol' })
  rol: Rol;

  @ApiProperty({
    isArray: true,
    type: String,
    example: ['inventario.consultar', 'salidas.registrar'],
    description: 'Permisos concedidos al rol en este momento',
  })
  permisos: string[];
}

export class SesionDto {
  @ApiProperty({ description: 'Token JWT para el encabezado Authorization' })
  accessToken: string;

  @ApiProperty({ type: UsuarioSesionDto })
  usuario: UsuarioSesionDto;
}
