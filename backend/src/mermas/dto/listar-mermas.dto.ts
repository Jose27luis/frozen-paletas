import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { OrigenMerma } from '../../generated/prisma/enums';

export class ListarMermasDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  saborId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  causaId?: string;

  @ApiPropertyOptional({ enum: OrigenMerma, enumName: 'OrigenMerma' })
  @IsOptional()
  @IsEnum(OrigenMerma)
  origen?: OrigenMerma;

  @ApiPropertyOptional({ example: '2026-09-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-09-30', format: 'date' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limite?: number;
}
