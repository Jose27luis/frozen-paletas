import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class VariablesEntorno {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN_SECONDS: number;

  @IsString()
  @IsNotEmpty()
  ORIGENES_PERMITIDOS: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;
}

export function validarEntorno(
  configuracion: Record<string, unknown>,
): VariablesEntorno {
  const validada = plainToInstance(VariablesEntorno, configuracion, {
    enableImplicitConversion: true,
  });

  const errores = validateSync(validada, { skipMissingProperties: false });

  if (errores.length > 0) {
    throw new Error(
      `Configuración de entorno inválida:\n${errores.join('\n')}`,
    );
  }

  return validada;
}
