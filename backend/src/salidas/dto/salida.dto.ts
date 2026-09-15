import { ApiProperty } from '@nestjs/swagger';
import { TipoSalida } from '../../generated/prisma/enums';

export class SalidaDetalleDto {
  @ApiProperty({ format: 'uuid' })
  saborId: string;

  @ApiProperty({ example: 'Fresa con relleno de leche condensada' })
  sabor: string;

  @ApiProperty({ format: 'uuid' })
  loteId: string;

  @ApiProperty({ example: 'FRE-120926-01' })
  lote: string;

  @ApiProperty({ example: 70 })
  cantidad: number;

  @ApiProperty({ example: '5.00', nullable: true })
  precioUnitario: string | null;

  @ApiProperty({
    example: false,
    description: 'Verdadero cuando se eligió el lote a mano en vez de por PEPS',
  })
  loteManual: boolean;
}

export class SalidaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'date' })
  fecha: Date;

  @ApiProperty({ enum: TipoSalida, enumName: 'TipoSalida' })
  tipo: TipoSalida;

  @ApiProperty({ format: 'uuid', nullable: true })
  destinoId: string | null;

  @ApiProperty({ example: 'Bodega La Esquina', nullable: true })
  destino: string | null;

  @ApiProperty({ nullable: true })
  motivo: string | null;

  @ApiProperty({ example: 120, description: 'Paletas que salieron en total' })
  cantidadTotal: number;

  @ApiProperty({ example: '600.00', description: 'Importe de la salida' })
  importe: string;

  @ApiProperty({ example: 'Darwin Quispe Mamani' })
  usuario: string;

  @ApiProperty({ type: [SalidaDetalleDto] })
  detalles: SalidaDetalleDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
