import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoSalida } from '../../generated/prisma/enums';

export class CrearDestinoDto {
  @ApiProperty({ enum: TipoSalida, enumName: 'TipoSalida' })
  @IsEnum(TipoSalida)
  tipo: TipoSalida;

  @ApiProperty({ example: 'Bodega La Esquina', maxLength: 120 })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({ example: 'Jr. Cusco 412', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  direccion?: string;

  @ApiPropertyOptional({ example: '982334455', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;
}
