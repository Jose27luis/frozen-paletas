import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { TipoSalida } from '../../generated/prisma/enums';

export class ListarDestinosDto {
  @ApiPropertyOptional({ enum: TipoSalida, enumName: 'TipoSalida' })
  @IsOptional()
  @IsEnum(TipoSalida)
  tipo?: TipoSalida;

  @ApiPropertyOptional({ description: 'Dejar solo los destinos en servicio' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  activo?: boolean;
}
