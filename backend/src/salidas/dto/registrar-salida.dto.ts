import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TipoSalida } from '../../generated/prisma/enums';

export class LineaSalidaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  saborId: string;

  @ApiProperty({ example: 120, minimum: 1 })
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Lote concreto a descontar. Si no se envía, se descuenta por PEPS del más antiguo',
  })
  @IsOptional()
  @IsUUID()
  loteId?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Precio por paleta; en delivery vale 5.00 si no se envía',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  precioUnitario?: number;
}

export class RegistrarSalidaDto {
  @ApiPropertyOptional({
    example: '2026-09-15',
    format: 'date',
    description: 'Si no se envía, se toma la fecha de hoy en Puerto Maldonado',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({ enum: TipoSalida, enumName: 'TipoSalida' })
  @IsEnum(TipoSalida)
  tipo: TipoSalida;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Obligatorio en punto de venta y mayorista; opcional en delivery y feria',
  })
  @IsOptional()
  @IsUUID()
  destinoId?: string;

  @ApiPropertyOptional({
    maxLength: 300,
    description:
      'Obligatorio en otra salida, y cuando no se indica destino en delivery o feria',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  motivo?: string;

  @ApiProperty({ type: [LineaSalidaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaSalidaDto)
  detalles: LineaSalidaDto[];

  @ApiProperty({
    format: 'uuid',
    description: 'Clave generada en el teléfono para no duplicar al reintentar',
  })
  @IsUUID()
  claveIdempotencia: string;
}
