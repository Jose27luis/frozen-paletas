import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class RegistrarMermaDto {
  @ApiPropertyOptional({
    example: '2026-09-15',
    format: 'date',
    description: 'Si no se envía, se toma la fecha de hoy en Puerto Maldonado',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  saborId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Lote afectado. Sin él, se descuenta del más antiguo (PEPS)',
  })
  @IsOptional()
  @IsUUID()
  loteId?: string;

  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  causaId: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacion?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Clave generada en el teléfono para no duplicar al reintentar',
  })
  @IsUUID()
  claveIdempotencia: string;
}
