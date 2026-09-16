import { EstadoLote, EstadoProduccion, EstadoSabor, EstadoStock } from './modelos';

export type TonoEstado = 'neutro' | 'hoja' | 'aguaje' | 'granate' | 'helado';

export type TonoDeStock = 'hoja' | 'aguaje' | 'granate';

export const TONO_DEL_STOCK: Readonly<Record<EstadoStock, TonoDeStock>> = {
  DISPONIBLE: 'hoja',
  REPONER: 'aguaje',
  AGOTADO: 'granate',
};

export const RELLENO_DEL_STOCK: Readonly<Record<EstadoStock, string>> = {
  DISPONIBLE: 'bg-hoja',
  REPONER: 'bg-aguaje-vivo',
  AGOTADO: 'bg-granate',
};

export const URGENCIA_DEL_STOCK: Readonly<Record<EstadoStock, number>> = {
  AGOTADO: 0,
  REPONER: 1,
  DISPONIBLE: 2,
};

export const TONO_DEL_LOTE: Readonly<Record<EstadoLote, TonoEstado>> = {
  PENDIENTE: 'neutro',
  ABIERTO: 'hoja',
  PARCIAL: 'helado',
  AGOTADO: 'neutro',
};

export const TONO_DE_LA_PRODUCCION: Readonly<Record<EstadoProduccion, TonoEstado>> = {
  REGISTRADA: 'aguaje',
  EMBOLSADA: 'hoja',
  ANULADA: 'neutro',
};

export const TONO_DEL_SABOR: Readonly<Record<EstadoSabor, TonoEstado>> = {
  ACTIVO: 'hoja',
  PROXIMO: 'helado',
  INACTIVO: 'neutro',
};
