import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface CuerpoError {
  statusCode: number;
  error: string;
  message: string | string[];
  campos?: Record<string, string>;
}

const NOMBRES_ESTADO: Readonly<Record<number, string>> = {
  400: 'Solicitud inválida',
  401: 'Sesión requerida',
  403: 'Sin permiso',
  404: 'No encontrado',
  409: 'Conflicto',
  422: 'Datos no procesables',
  429: 'Demasiadas peticiones',
  500: 'Error del servidor',
  503: 'Servicio no disponible',
};

const TRADUCCIONES: ReadonlyArray<[RegExp, string]> = [
  [/^Unauthorized$/i, 'No has iniciado sesión o tu sesión expiró'],
  [/^Forbidden(\sresource)?$/i, 'No tienes permiso para hacer esto'],
  [/^Not Found$/i, 'No se encontró lo que buscabas'],
  [/^Internal server error$/i, 'Ocurrió un error en el servidor'],
  [/^Cannot\s+\w+\s+\S+$/i, 'La ruta solicitada no existe'],
  [
    /^Validation failed \(uuid is expected\)$/i,
    'El identificador enviado no es válido',
  ],
  [
    /^Validation failed \(numeric string is expected\)$/i,
    'Se esperaba un número',
  ],
  [/^Validation failed$/i, 'Los datos enviados no son válidos'],
  [/^Request Timeout$/i, 'La petición tardó demasiado'],
];

function traducir(mensaje: string): string {
  for (const [patron, espanol] of TRADUCCIONES) {
    if (patron.test(mensaje)) {
      return espanol;
    }
  }

  return mensaje;
}

function nombreDe(estado: number): string {
  return NOMBRES_ESTADO[estado] ?? 'Error';
}

function extraerMensaje(respuesta: string | object): string | string[] {
  if (typeof respuesta === 'string') {
    return traducir(respuesta);
  }

  const cuerpo = respuesta as { message?: string | string[] };

  if (Array.isArray(cuerpo.message)) {
    return cuerpo.message.map(traducir);
  }

  if (typeof cuerpo.message === 'string') {
    return traducir(cuerpo.message);
  }

  return 'Ocurrió un error inesperado';
}

function extraerCampos(
  respuesta: string | object,
): Record<string, string> | undefined {
  if (typeof respuesta === 'string') {
    return undefined;
  }

  const { campos } = respuesta as { campos?: Record<string, string> };

  return campos;
}

@Catch()
export class ExcepcionesFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExcepcionesFilter.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const respuesta = contexto.getResponse<Response>();
    const peticion = contexto.getRequest<Request>();

    const cuerpo = this.componer(excepcion, peticion);

    respuesta.status(cuerpo.statusCode).json(cuerpo);
  }

  private componer(excepcion: unknown, peticion: Request): CuerpoError {
    if (excepcion instanceof HttpException) {
      const estado = excepcion.getStatus();
      const respuesta = excepcion.getResponse();
      const campos = extraerCampos(respuesta);

      return {
        statusCode: estado,
        error: nombreDe(estado),
        message: extraerMensaje(respuesta),
        ...(campos === undefined ? {} : { campos }),
      };
    }

    this.logger.error(
      `${peticion.method} ${peticion.url}`,
      excepcion instanceof Error ? excepcion.stack : String(excepcion),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: nombreDe(HttpStatus.INTERNAL_SERVER_ERROR),
      message: 'Ocurrió un error en el servidor. Inténtalo de nuevo.',
    };
  }
}
