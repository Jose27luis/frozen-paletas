import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

export const exigeSesion: CanActivateFn = () => {
  const sesion = inject(SesionService);

  return sesion.autenticado() ? true : inject(Router).createUrlTree(['/acceso']);
};

export const soloInvitados: CanActivateFn = () => {
  const sesion = inject(SesionService);

  return sesion.autenticado() ? inject(Router).createUrlTree(['/panel']) : true;
};

export function exigePermiso(clave: string): CanActivateFn {
  return () => {
    const sesion = inject(SesionService);
    const router = inject(Router);

    if (!sesion.autenticado()) {
      return router.createUrlTree(['/acceso']);
    }

    return sesion.puede(clave) ? true : router.createUrlTree(['/panel']);
  };
}
