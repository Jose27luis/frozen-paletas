import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class RegistrarProduccionDto {
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

  @ApiProperty({
    example: 150,
    minimum: 1,
    description:
      'Paletas contadas al terminar la producción, antes de embolsar',
  })
  @IsInt()
  @Min(1)
  cantidadObtenida: number;

  @ApiProperty({
    format: 'uuid',
    description: 'Clave generada en el teléfono para no duplicar al reintentar',
  })
  @IsUUID()
  claveIdempotencia: string;
}
