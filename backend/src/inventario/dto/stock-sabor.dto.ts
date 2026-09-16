import { ApiProperty } from '@nestjs/swagger';
import { CategoriaSabor, EstadoSabor } from '../../generated/prisma/enums';
import { EstadoStock } from '../estado-stock';

export class LoteMasAntiguoDto {
  @ApiProperty({ example: 'COC-140926-01' })
  codigo: string;

  @ApiProperty({ type: String, format: 'date' })
  fecha: Date;

  @ApiProperty({ example: 40, description: 'Paletas que quedan de ese lote' })
  stockRestante: number;

  @ApiProperty({ example: 12, description: 'Días desde que se produjo' })
  antiguedad: number;
}

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

  @ApiProperty({ example: 3, description: 'Lotes que todavía tienen paletas' })
  lotesAbiertos: number;

  @ApiProperty({
    type: LoteMasAntiguoDto,
    nullable: true,
    description: 'El lote que se despacha primero por PEPS',
  })
  loteMasAntiguo: LoteMasAntiguoDto | null;
}

export class InventarioDto {
  @ApiProperty({ example: 1240, description: 'Suma de paletas disponibles' })
  total: number;

  @ApiProperty({ type: [StockSaborDto] })
  sabores: StockSaborDto[];
}
