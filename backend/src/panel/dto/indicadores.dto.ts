import { ApiProperty } from '@nestjs/swagger';
import { TipoSalida } from '../../generated/prisma/enums';
import { EstadoStock } from '../../inventario/estado-stock';

export class IndicadorSaborDto {
  @ApiProperty({ format: 'uuid' })
  saborId: string;

  @ApiProperty({ example: 'Coco con relleno de manjar' })
  nombre: string;

  @ApiProperty({ example: 'COC' })
  abreviatura: string;

  @ApiProperty({ example: 147, description: 'Paletas disponibles ahora mismo' })
  stock: number;

  @ApiProperty({ example: 80 })
  stockMinimo: number;

  @ApiProperty({ enum: EstadoStock, enumName: 'EstadoStock' })
  estado: EstadoStock;

  @ApiProperty({
    example: 300,
    description: 'Paletas que ingresaron en el periodo',
  })
  producido: number;

  @ApiProperty({
    example: 220,
    description: 'Paletas que salieron en el periodo',
  })
  salido: number;

  @ApiProperty({ example: 6, description: 'Paletas perdidas en el periodo' })
  merma: number;

  @ApiProperty({
    example: 12,
    nullable: true,
    description: 'Días que aguanta el stock al ritmo de salida del periodo',
  })
  cobertura: number | null;
}

export class SalidaPorCanalDto {
  @ApiProperty({ enum: TipoSalida, enumName: 'TipoSalida' })
  tipo: TipoSalida;

  @ApiProperty({ example: 420 })
  cantidad: number;
}

export class ProduccionDelPeriodoDto {
  @ApiProperty({
    example: 1500,
    description: 'Paletas contadas al salir del balde',
  })
  obtenido: number;

  @ApiProperty({
    example: 1460,
    description: 'Paletas aptas que entraron al stock',
  })
  embolsado: number;

  @ApiProperty({
    example: 40,
    description: 'Paletas perdidas antes de entrar al stock',
  })
  merma: number;

  @ApiProperty({
    example: '97.3',
    description: 'Porcentaje de lo obtenido que llegó a venderse',
  })
  rendimiento: string;
}

export class MermaDelPeriodoDto {
  @ApiProperty({ example: 52 })
  total: number;

  @ApiProperty({ example: 12, description: 'Perdidas ya estando en almacén' })
  enAlmacen: number;

  @ApiProperty({
    example: 40,
    description: 'Perdidas durante producción o embolsado',
  })
  enProceso: number;

  @ApiProperty({ example: '3.5', description: 'Porcentaje sobre lo obtenido' })
  porcentaje: string;
}

export class StockActualDto {
  @ApiProperty({ example: 1240 })
  total: number;

  @ApiProperty({
    example: 14,
    nullable: true,
    description: 'Días que aguanta el stock al ritmo de salida del periodo',
  })
  cobertura: number | null;
}

export class IndicadoresDto {
  @ApiProperty({ type: String, format: 'date' })
  desde: string;

  @ApiProperty({ type: String, format: 'date' })
  hasta: string;

  @ApiProperty({ example: 30 })
  dias: number;

  @ApiProperty({ type: ProduccionDelPeriodoDto })
  produccion: ProduccionDelPeriodoDto;

  @ApiProperty({
    example: 980,
    description: 'Paletas que salieron en el periodo',
  })
  salidas: number;

  @ApiProperty({ type: [SalidaPorCanalDto] })
  salidasPorCanal: SalidaPorCanalDto[];

  @ApiProperty({ type: MermaDelPeriodoDto })
  mermas: MermaDelPeriodoDto;

  @ApiProperty({ type: StockActualDto })
  stock: StockActualDto;

  @ApiProperty({ type: [IndicadorSaborDto] })
  sabores: IndicadorSaborDto[];
}
