import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CategoriaSabor, EstadoSabor } from '../../generated/prisma/enums';

export class CrearSaborDto {
  @ApiProperty({ example: 'Fresa con relleno de leche condensada' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre: string;

  @ApiProperty({
    example: 'FRE',
    description: 'Tres letras que identifican al sabor en el código de lote',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-ZÑ]{3}$/, {
    message: 'La abreviatura debe ser de tres letras',
  })
  abreviatura: string;

  @ApiProperty({ enum: CategoriaSabor, enumName: 'CategoriaSabor' })
  @IsEnum(CategoriaSabor)
  categoria: CategoriaSabor;

  @ApiPropertyOptional({
    enum: EstadoSabor,
    enumName: 'EstadoSabor',
    default: EstadoSabor.ACTIVO,
  })
  @IsOptional()
  @IsEnum(EstadoSabor)
  estado?: EstadoSabor;

  @ApiPropertyOptional({ example: 80, minimum: 0, default: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;
}
