import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CategoriaSabor, EstadoSabor } from '../../generated/prisma/enums';

export class ListarSaboresDto {
  @ApiPropertyOptional({ enum: EstadoSabor, enumName: 'EstadoSabor' })
  @IsOptional()
  @IsEnum(EstadoSabor)
  estado?: EstadoSabor;

  @ApiPropertyOptional({ enum: CategoriaSabor, enumName: 'CategoriaSabor' })
  @IsOptional()
  @IsEnum(CategoriaSabor)
  categoria?: CategoriaSabor;
}
