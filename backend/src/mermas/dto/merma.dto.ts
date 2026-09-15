import { ApiProperty } from '@nestjs/swagger';
import { OrigenMerma } from '../../generated/prisma/enums';

export class MermaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'date' })
  fecha: Date;

  @ApiProperty({ format: 'uuid' })
  saborId: string;

  @ApiProperty({ example: 'Coco con relleno de manjar' })
  sabor: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  loteId: string | null;

  @ApiProperty({ example: 'COC-140926-01', nullable: true })
  lote: string | null;

  @ApiProperty({ example: 3 })
  cantidad: number;

  @ApiProperty({ example: 'Rotura' })
  causa: string;

  @ApiProperty({ enum: OrigenMerma, enumName: 'OrigenMerma' })
  origen: OrigenMerma;

  @ApiProperty({ nullable: true })
  observacion: string | null;

  @ApiProperty({
    example: true,
    description: 'Indica si la merma llegó a descontar del inventario',
  })
  descontoStock: boolean;

  @ApiProperty({ example: 'Katerin Huamán Soto' })
  responsable: string;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
