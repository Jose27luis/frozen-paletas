import { ApiProperty } from '@nestjs/swagger';

export class CausaMermaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Rotura' })
  nombre: string;

  @ApiProperty({
    example: false,
    description: 'Obliga a escribir una observación al registrar la merma',
  })
  requiereDescripcion: boolean;

  @ApiProperty({ example: true })
  activa: boolean;

  @ApiProperty({
    example: 3,
    description:
      'Mermas registradas con esta causa; con una sola ya no se puede eliminar',
  })
  usos: number;
}
