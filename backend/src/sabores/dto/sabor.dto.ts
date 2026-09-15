import { ApiProperty } from '@nestjs/swagger';
import { CategoriaSabor, EstadoSabor } from '../../generated/prisma/enums';

export class SaborDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Fresa con relleno de leche condensada' })
  nombre: string;

  @ApiProperty({ example: 'FRE', description: 'Tres letras para el lote' })
  abreviatura: string;

  @ApiProperty({ enum: CategoriaSabor, enumName: 'CategoriaSabor' })
  categoria: CategoriaSabor;

  @ApiProperty({ enum: EstadoSabor, enumName: 'EstadoSabor' })
  estado: EstadoSabor;

  @ApiProperty({ example: 80, description: 'Umbral de reposición del sabor' })
  stockMinimo: number;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
