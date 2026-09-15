import { ApiProperty } from '@nestjs/swagger';
import { TipoMovimiento } from '../../generated/prisma/enums';

export class MovimientoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TipoMovimiento, enumName: 'TipoMovimiento' })
  tipo: TipoMovimiento;

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

  @ApiProperty({
    example: -120,
    description: 'Positivo cuando entra al stock, negativo cuando sale',
  })
  cantidad: number;

  @ApiProperty({ example: 'Katerin Huamán Soto' })
  usuario: string;

  @ApiProperty({ example: 'salida', nullable: true })
  referenciaTipo: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  referenciaId: string | null;

  @ApiProperty({ nullable: true })
  motivo: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
