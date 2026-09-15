import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'darwin@frozen.pe',
    description: 'Correo registrado del usuario',
  })
  @IsEmail()
  correo: string;

  @ApiProperty({
    example: 'contrasena-segura',
    minLength: 8,
    description: 'Contraseña en claro',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
