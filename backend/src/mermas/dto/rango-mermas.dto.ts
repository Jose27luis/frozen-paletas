import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class RangoMermasDto {
  @ApiPropertyOptional({
    example: '2026-08-17',
    format: 'date',
    description: 'Si no se envía, se toman los últimos 30 días',
  })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-09-16', format: 'date' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
