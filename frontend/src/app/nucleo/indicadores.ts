import { EstadoStock, TipoSalida } from './modelos';

export interface IndicadorSabor {
  saborId: string;
  nombre: string;
  abreviatura: string;
  stock: number;
  stockMinimo: number;
  estado: EstadoStock;
  producido: number;
  salido: number;
  merma: number;
  cobertura: number | null;
}

export interface SalidaPorCanal {
  tipo: TipoSalida;
  cantidad: number;
}

export interface Indicadores {
  desde: string;
  hasta: string;
  dias: number;
  produccion: {
    obtenido: number;
    embolsado: number;
    merma: number;
    rendimiento: string;
  };
  salidas: number;
  salidasPorCanal: SalidaPorCanal[];
  mermas: {
    total: number;
    enAlmacen: number;
    enProceso: number;
    porcentaje: string;
  };
  stock: {
    total: number;
    cobertura: number | null;
  };
  sabores: IndicadorSabor[];
}
