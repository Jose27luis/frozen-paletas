import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { RUTA_RENOVAR, SesionService } from './sesion.service';

export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  const token = sesion.token();
  const esRenovacion = peticion.url.endsWith(RUTA_RENOVAR);

  const conCredenciales =
    token === null
      ? peticion
      : peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return siguiente(conCredenciales).pipe(
    tap((evento) => {
      if (evento instanceof HttpResponse && !esRenovacion) {
        void sesion.renovarSiHaceFalta();
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && sesion.autenticado() && !esRenovacion) {
        sesion.salir();
      }

      return throwError(() => error);
    }),
  );
};
