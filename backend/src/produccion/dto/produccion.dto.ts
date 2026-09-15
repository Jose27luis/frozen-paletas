import { ApiProperty } from '@nestjs/swagger';
import { EstadoProduccion } from '../../generated/prisma/enums';

export class ProduccionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'date' })
  fecha: Date;

  @ApiProperty({ format: 'uuid' })
  saborId: string;

  @ApiProperty({ example: 'Coco con relleno de manjar' })
  sabor: string;

  @ApiProperty({ example: 150 })
  cantidadObtenida: number;

  @ApiProperty({
    example: 147,
    nullable: true,
    description: 'Queda en nulo mientras no se registre el embolsado',
  })
  cantidadEmbolsada: number | null;

  @ApiProperty({
    example: 3,
    nullable: true,
    description: 'Diferencia entre lo obtenido y lo apto para venta',
  })
  merma: number | null;

  @ApiProperty({ enum: EstadoProduccion, enumName: 'EstadoProduccion' })
  estado: EstadoProduccion;

  @ApiProperty({ format: 'uuid', nullable: true })
  loteId: string | null;

  @ApiProperty({ example: 'COC-140926-01', nullable: true })
  lote: string | null;

  @ApiProperty({ example: 'Katerin Huamán Soto' })
  responsable: string;

  @ApiProperty({ nullable: true })
  motivoAnulacion: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  embolsadoEn: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
