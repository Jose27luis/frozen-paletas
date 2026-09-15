import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ActualizarDestinoDto {
  @ApiPropertyOptional({ example: 'Bodega La Esquina', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Jr. Cusco 412', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  direccion?: string;

  @ApiPropertyOptional({ example: '982334455', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;
}
