import { ApiProperty } from '@nestjs/swagger';

export class MermaPorCausaDto {
  @ApiProperty({ example: 'Rotura' })
  causa: string;

  @ApiProperty({ example: 42, description: 'Paletas perdidas por esa causa' })
  cantidad: number;

  @ApiProperty({ example: 7, description: 'Veces que se registró' })
  registros: number;
}

export class MermaPorSaborDto {
  @ApiProperty({ example: 'Coco con relleno de manjar' })
  sabor: string;

  @ApiProperty({ example: 18 })
  cantidad: number;
}

export class ResumenMermasDto {
  @ApiProperty({ type: String, format: 'date' })
  desde: string;

  @ApiProperty({ type: String, format: 'date' })
  hasta: string;

  @ApiProperty({ example: 52 })
  total: number;

  @ApiProperty({ example: 12, description: 'Perdidas ya estando en almacén' })
  enAlmacen: number;

  @ApiProperty({
    example: 40,
    description: 'Perdidas durante producción o embolsado',
  })
  enProceso: number;

  @ApiProperty({ type: [MermaPorCausaDto] })
  porCausa: MermaPorCausaDto[];

  @ApiProperty({ type: [MermaPorSaborDto] })
  porSabor: MermaPorSaborDto[];
}
