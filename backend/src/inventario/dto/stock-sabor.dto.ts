import { ApiProperty } from '@nestjs/swagger';
import { CategoriaSabor, EstadoSabor } from '../../generated/prisma/enums';
import { EstadoStock } from '../estado-stock';

export class StockSaborDto {
  @ApiProperty({ format: 'uuid' })
  saborId: string;

  @ApiProperty({ example: 'Coco con relleno de manjar' })
  nombre: string;

  @ApiProperty({ example: 'COC' })
  abreviatura: string;

  @ApiProperty({ enum: CategoriaSabor, enumName: 'CategoriaSabor' })
  categoria: CategoriaSabor;

  @ApiProperty({ enum: EstadoSabor, enumName: 'EstadoSabor' })
  estadoSabor: EstadoSabor;

  @ApiProperty({ example: 147, description: 'Paletas disponibles' })
  stock: number;

  @ApiProperty({ example: 80 })
  stockMinimo: number;

  @ApiProperty({ enum: EstadoStock, enumName: 'EstadoStock' })
  estado: EstadoStock;
}

export class InventarioDto {
  @ApiProperty({ example: 1240, description: 'Suma de paletas disponibles' })
  total: number;

  @ApiProperty({ type: [StockSaborDto] })
  sabores: StockSaborDto[];
}
