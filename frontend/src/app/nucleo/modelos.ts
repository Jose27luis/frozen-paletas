export type Rol = 'ADMIN' | 'OPERACIONES' | 'PRODUCCION' | 'CONSULTA';

export type CategoriaSabor = 'CON_RELLENO' | 'AMAZONICO' | 'FRUTAL' | 'CREMOSO' | 'BEBIDA';

export type EstadoSabor = 'ACTIVO' | 'PROXIMO' | 'INACTIVO';

export type EstadoStock = 'DISPONIBLE' | 'REPONER' | 'AGOTADO';

export type EstadoProduccion = 'REGISTRADA' | 'EMBOLSADA' | 'ANULADA';

export type EstadoLote = 'PENDIENTE' | 'ABIERTO' | 'PARCIAL' | 'AGOTADO';

export type TipoMovimiento = 'INGRESO_PRODUCCION' | 'SALIDA' | 'MERMA' | 'AJUSTE';

export type TipoSalida = 'PDV' | 'MAYORISTA' | 'DELIVERY' | 'FERIA' | 'OTRA';

export type OrigenMerma = 'PRODUCCION' | 'EMBOLSADO' | 'STOCK';

export interface UsuarioSesion {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  permisos: string[];
}

export interface Sesion {
  accessToken: string;
  usuario: UsuarioSesion;
}

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
}

export interface Sabor {
  id: string;
  nombre: string;
  abreviatura: string;
  categoria: CategoriaSabor;
  estado: EstadoSabor;
  stockMinimo: number;
  precioUnidad: string | null;
  precioMayor: string | null;
  creadoEn: string;
}

export interface LoteMasAntiguo {
  codigo: string;
  fecha: string;
  stockRestante: number;
  antiguedad: number;
}

export interface StockSabor {
  saborId: string;
  nombre: string;
  abreviatura: string;
  categoria: CategoriaSabor;
  estadoSabor: EstadoSabor;
  stock: number;
  stockMinimo: number;
  estado: EstadoStock;
  lotesAbiertos: number;
  loteMasAntiguo: LoteMasAntiguo | null;
}

export interface Inventario {
  total: number;
  sabores: StockSabor[];
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  fecha: string;
  saborId: string;
  sabor: string;
  loteId: string | null;
  lote: string | null;
  cantidad: number;
  usuario: string;
  referenciaTipo: string | null;
  referenciaId: string | null;
  motivo: string | null;
  creadoEn: string;
}

export interface Lote {
  id: string;
  codigo: string;
  saborId: string;
  sabor: string;
  fechaProduccion: string;
  correlativo: number;
  cantidadIngresada: number;
  stockRestante: number;
  estado: EstadoLote;
  produccionId: string;
  responsable: string;
  creadoEn: string;
}

export interface Produccion {
  id: string;
  fecha: string;
  saborId: string;
  sabor: string;
  cantidadObtenida: number;
  cantidadEmbolsada: number | null;
  merma: number | null;
  estado: EstadoProduccion;
  loteId: string | null;
  lote: string | null;
  responsable: string;
  motivoAnulacion: string | null;
  embolsadoEn: string | null;
  creadoEn: string;
}

export interface Destino {
  id: string;
  tipo: TipoSalida;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
}

export interface SalidaDetalle {
  saborId: string;
  sabor: string;
  loteId: string;
  lote: string;
  cantidad: number;
  precioUnitario: string | null;
  loteManual: boolean;
}

export interface Salida {
  id: string;
  fecha: string;
  tipo: TipoSalida;
  destinoId: string | null;
  destino: string | null;
  motivo: string | null;
  cantidadTotal: number;
  importe: string;
  usuario: string;
  detalles: SalidaDetalle[];
  creadoEn: string;
}

export interface CausaMerma {
  id: string;
  nombre: string;
  requiereDescripcion: boolean;
  activa: boolean;
}

export interface Merma {
  id: string;
  fecha: string;
  saborId: string;
  sabor: string;
  loteId: string | null;
  lote: string | null;
  cantidad: number;
  causa: string;
  origen: OrigenMerma;
  observacion: string | null;
  descontoStock: boolean;
  responsable: string;
  creadoEn: string;
}

export interface Panel {
  stockTotal: number;
  sabores: StockSabor[];
  aReponer: StockSabor[];
  pendientesDeEmbolsar: number;
  produccionesRecientes: Produccion[];
  salidasRecientes: Salida[];
  mermasRecientes: Merma[];
}

export interface Permiso {
  clave: string;
  nombre: string;
  descripcion: string;
  roles: Rol[];
}
