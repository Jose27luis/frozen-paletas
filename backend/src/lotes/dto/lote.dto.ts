import { ApiProperty } from '@nestjs/swagger';
import { EstadoLote } from '../../generated/prisma/enums';

export class LoteDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'FRE-140926-01' })
  codigo: string;

  @ApiProperty({ format: 'uuid' })
  saborId: string;

  @ApiProperty({ example: 'Fresa con relleno de leche condensada' })
  sabor: string;

  @ApiProperty({ type: String, format: 'date' })
  fechaProduccion: Date;

  @ApiProperty({ example: 1, description: 'Producción del día para el sabor' })
  correlativo: number;

  @ApiProperty({ example: 147, description: 'Paletas que entraron al stock' })
  cantidadIngresada: number;

  @ApiProperty({ example: 40, description: 'Paletas que quedan del lote' })
  stockRestante: number;

  @ApiProperty({ enum: EstadoLote, enumName: 'EstadoLote' })
  estado: EstadoLote;

  @ApiProperty({ format: 'uuid' })
  produccionId: string;

  @ApiProperty({ example: 'Katerin Huamán Soto' })
  responsable: string;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
