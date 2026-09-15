import { ApiProperty } from '@nestjs/swagger';

export enum EstadoBaseDatos {
  DISPONIBLE = 'disponible',
  NO_DISPONIBLE = 'no disponible',
}

export class HealthDto {
  @ApiProperty({ example: 'ok' })
  estado: string;

  @ApiProperty({ enum: EstadoBaseDatos, enumName: 'EstadoBaseDatos' })
  baseDatos: EstadoBaseDatos;

  @ApiProperty({ type: String, format: 'date-time' })
  instante: string;
}
