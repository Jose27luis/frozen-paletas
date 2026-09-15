import { Rol } from '../../generated/prisma/enums';

export interface UsuarioAutenticado {
  id: string;
  correo: string;
  nombres: string;
  apellidos: string;
  rol: Rol;
}

export interface CargaJwt {
  sub: string;
  correo: string;
  rol: Rol;
}
