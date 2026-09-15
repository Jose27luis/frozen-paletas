import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AnularProduccionDto {
  @ApiProperty({
    example: 'Se registró el sabor equivocado',
    maxLength: 300,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  motivo: string;
}
