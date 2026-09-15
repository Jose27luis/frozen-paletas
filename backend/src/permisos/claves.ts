import { Rol } from '../generated/prisma/enums';

export const PERMISOS = {
  CONSULTAR_INVENTARIO: 'inventario.consultar',
  REGISTRAR_PRODUCCION: 'produccion.registrar',
  REGISTRAR_MERMAS: 'mermas.registrar',
  REGISTRAR_SALIDAS: 'salidas.registrar',
  REALIZAR_CONTEOS: 'conteos.realizar',
  AUTORIZAR_AJUSTES: 'conteos.autorizar',
  ADMINISTRAR_SABORES: 'sabores.administrar',
  ADMINISTRAR_DESTINOS: 'destinos.administrar',
  CONSULTAR_REPORTES: 'reportes.consultar',
  ADMINISTRAR_USUARIOS: 'usuarios.administrar',
} as const;

export type ClavePermiso = (typeof PERMISOS)[keyof typeof PERMISOS];

export interface DefinicionPermiso {
  clave: ClavePermiso;
  nombre: string;
  descripcion: string;
}

export const CATALOGO_PERMISOS: readonly DefinicionPermiso[] = [
  {
    clave: PERMISOS.CONSULTAR_INVENTARIO,
    nombre: 'Consultar inventario e indicadores',
    descripcion: 'Ver el stock por sabor, los lotes y el panel principal',
  },
  {
    clave: PERMISOS.REGISTRAR_PRODUCCION,
    nombre: 'Registrar producción y embolsado',
    descripcion: 'Anotar lo producido y la cantidad final apta para venta',
  },
  {
    clave: PERMISOS.REGISTRAR_MERMAS,
    nombre: 'Registrar mermas',
    descripcion: 'Anotar producto perdido en producción, embolsado o stock',
  },
  {
    clave: PERMISOS.REGISTRAR_SALIDAS,
    nombre: 'Registrar salidas',
    descripcion: 'Descontar producto hacia PDV, mayorista, delivery o feria',
  },
  {
    clave: PERMISOS.REALIZAR_CONTEOS,
    nombre: 'Realizar conteo físico',
    descripcion: 'Abrir un conteo quincenal y cargar las cantidades contadas',
  },
  {
    clave: PERMISOS.AUTORIZAR_AJUSTES,
    nombre: 'Autorizar ajustes de inventario',
    descripcion: 'Aprobar las diferencias de un conteo y aplicar el ajuste',
  },
  {
    clave: PERMISOS.ADMINISTRAR_SABORES,
    nombre: 'Administrar sabores',
    descripcion: 'Crear, editar, activar o desactivar sabores del catálogo',
  },
  {
    clave: PERMISOS.ADMINISTRAR_DESTINOS,
    nombre: 'Administrar clientes y puntos de venta',
    descripcion: 'Mantener la lista de destinos a los que sale el producto',
  },
  {
    clave: PERMISOS.CONSULTAR_REPORTES,
    nombre: 'Consultar reportes',
    descripcion: 'Ver los reportes filtrados por fechas y su histórico',
  },
  {
    clave: PERMISOS.ADMINISTRAR_USUARIOS,
    nombre: 'Crear usuarios y editar permisos',
    descripcion: 'Dar de alta usuarios y cambiar lo que puede hacer cada rol',
  },
];

export const PERMISOS_POR_DEFECTO: Readonly<
  Record<Rol, readonly ClavePermiso[]>
> = {
  [Rol.ADMIN]: CATALOGO_PERMISOS.map((permiso) => permiso.clave),
  [Rol.OPERACIONES]: [
    PERMISOS.CONSULTAR_INVENTARIO,
    PERMISOS.REGISTRAR_PRODUCCION,
    PERMISOS.REGISTRAR_MERMAS,
    PERMISOS.REGISTRAR_SALIDAS,
    PERMISOS.REALIZAR_CONTEOS,
    PERMISOS.AUTORIZAR_AJUSTES,
    PERMISOS.ADMINISTRAR_SABORES,
    PERMISOS.ADMINISTRAR_DESTINOS,
    PERMISOS.CONSULTAR_REPORTES,
  ],
  [Rol.PRODUCCION]: [
    PERMISOS.CONSULTAR_INVENTARIO,
    PERMISOS.REGISTRAR_PRODUCCION,
    PERMISOS.REGISTRAR_MERMAS,
    PERMISOS.REALIZAR_CONTEOS,
  ],
  [Rol.CONSULTA]: [PERMISOS.CONSULTAR_INVENTARIO, PERMISOS.CONSULTAR_REPORTES],
};
