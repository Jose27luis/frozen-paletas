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
}
