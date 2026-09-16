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

  @ApiProperty({
    example: '5.00',
    nullable: true,
    description: 'Precio de venta al público, por paleta suelta',
  })
  precioUnidad: string | null;

  @ApiProperty({
    example: '3.20',
    nullable: true,
    description: 'Precio por mayor, para puntos de venta y mayoristas',
  })
  precioMayor: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
