import { ApiProperty } from '@nestjs/swagger';
import { TipoSalida } from '../../generated/prisma/enums';

export class DestinoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: TipoSalida, enumName: 'TipoSalida' })
  tipo: TipoSalida;

  @ApiProperty({ example: 'Bodega La Esquina' })
  nombre: string;

  @ApiProperty({ example: 'Jr. Cusco 412', nullable: true })
  direccion: string | null;

  @ApiProperty({ example: '982334455', nullable: true })
  telefono: string | null;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  creadoEn: Date;
}
