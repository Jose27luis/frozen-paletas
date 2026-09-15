import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CrearCausaMermaDto {
  @ApiProperty({ example: 'Rotura', maxLength: 80 })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  nombre: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiereDescripcion?: boolean;
}
