import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class ActualizarUsuarioDto {
  @ApiPropertyOptional({ example: 'Katerin', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombres?: string;

  @ApiPropertyOptional({ example: 'Huamán Soto', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  apellidos?: string;

  @ApiPropertyOptional({ example: 'katerin@frozen.pe' })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ enum: Rol, enumName: 'Rol' })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @ApiPropertyOptional({ minLength: 8, description: 'Contraseña nueva' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;
}
