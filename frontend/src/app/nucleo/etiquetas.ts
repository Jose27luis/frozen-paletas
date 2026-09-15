import {
  CategoriaSabor,
  EstadoLote,
  EstadoProduccion,
  EstadoSabor,
  EstadoStock,
  OrigenMerma,
  Rol,
  TipoMovimiento,
  TipoSalida,
} from './modelos';

export const CATEGORIAS: Readonly<Record<CategoriaSabor, string>> = {
  CON_RELLENO: 'Con relleno',
  AMAZONICO: 'Amazónico',
  FRUTAL: 'Frutal',
  CREMOSO: 'Cremoso y clásico',
  BEBIDA: 'Inspirado en bebidas',
};

export const ESTADOS_SABOR: Readonly<Record<EstadoSabor, string>> = {
  ACTIVO: 'Activo',
  PROXIMO: 'Próximo',
  INACTIVO: 'Inactivo',
};

export const ESTADOS_STOCK: Readonly<Record<EstadoStock, string>> = {
  DISPONIBLE: 'Disponible',
  REPONER: 'Reponer',
  AGOTADO: 'Agotado',
};

export const ESTADOS_PRODUCCION: Readonly<Record<EstadoProduccion, string>> = {
  REGISTRADA: 'Falta embolsar',
  EMBOLSADA: 'En stock',
  ANULADA: 'Anulada',
};

export const ESTADOS_LOTE: Readonly<Record<EstadoLote, string>> = {
  PENDIENTE: 'Sin ingresar',
  ABIERTO: 'Completo',
  PARCIAL: 'Parcial',
  AGOTADO: 'Agotado',
};

export const TIPOS_SALIDA: Readonly<Record<TipoSalida, string>> = {
  PDV: 'Punto de venta',
  MAYORISTA: 'Cliente mayorista',
  DELIVERY: 'Delivery',
  FERIA: 'Feria',
  OTRA: 'Otra salida',
};

export const TIPOS_MOVIMIENTO: Readonly<Record<TipoMovimiento, string>> = {
  INGRESO_PRODUCCION: 'Ingreso por producción',
  SALIDA: 'Salida',
  MERMA: 'Merma',
  AJUSTE: 'Ajuste',
};

export const ORIGENES_MERMA: Readonly<Record<OrigenMerma, string>> = {
  PRODUCCION: 'En producción',
  EMBOLSADO: 'En embolsado',
  STOCK: 'En almacén',
};

export const ROLES: Readonly<Record<Rol, string>> = {
  ADMIN: 'Administración',
  OPERACIONES: 'Operaciones',
  PRODUCCION: 'Producción',
  CONSULTA: 'Consulta',
};

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
