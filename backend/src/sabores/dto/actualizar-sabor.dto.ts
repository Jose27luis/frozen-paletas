import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CategoriaSabor, EstadoSabor } from '../../generated/prisma/enums';

export class ActualizarSaborDto {
  @ApiPropertyOptional({ example: 'Fresa con relleno de leche condensada' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ example: 'FRE' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-ZÑ]{3}$/, {
    message: 'La abreviatura debe ser de tres letras',
  })
  abreviatura?: string;

  @ApiPropertyOptional({ enum: CategoriaSabor, enumName: 'CategoriaSabor' })
  @IsOptional()
  @IsEnum(CategoriaSabor)
  categoria?: CategoriaSabor;

  @ApiPropertyOptional({ enum: EstadoSabor, enumName: 'EstadoSabor' })
  @IsOptional()
  @IsEnum(EstadoSabor)
  estado?: EstadoSabor;

  @ApiPropertyOptional({ example: 80, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;

  @ApiPropertyOptional({ example: 5, description: 'Precio por paleta' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  precio?: number;
}
