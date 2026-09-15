import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class RegistrarEmbolsadoDto {
  @ApiProperty({
    example: 147,
    minimum: 0,
    description: 'Paletas embolsadas y aptas; es lo que ingresa al stock',
  })
  @IsInt()
  @Min(0)
  cantidadEmbolsada: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Causa obligatoria cuando se embolsa menos de lo obtenido',
  })
  @IsOptional()
  @IsUUID()
  causaId?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacion?: string;
}
