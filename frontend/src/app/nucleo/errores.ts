import { HttpErrorResponse } from '@angular/common/http';

interface CuerpoError {
  message?: string | string[];
}

export function mensajeDe(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }

  if (error.status === 0) {
    return 'No hay conexión con el servidor.';
  }

  const cuerpo = error.error as CuerpoError | null;
  const mensaje = cuerpo?.message;

  if (Array.isArray(mensaje)) {
    return mensaje.join('. ');
  }

  return mensaje ?? 'Ocurrió un error en el servidor.';
}
