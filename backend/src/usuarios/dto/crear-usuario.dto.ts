import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'Katerin', maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombres: string;

  @ApiProperty({ example: 'Huamán Soto', maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  apellidos: string;

  @ApiProperty({ example: 'katerin@frozen.pe' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'contrasena-segura', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ enum: Rol, enumName: 'Rol' })
  @IsEnum(Rol)
  rol: Rol;
}
