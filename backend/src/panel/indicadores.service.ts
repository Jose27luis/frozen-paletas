import { Injectable } from '@nestjs/common';
import { aFecha, aTextoIso, fechaDeHoy } from '../common/fechas/fecha';
import {
  EstadoProduccion,
  OrigenMerma,
  TipoSalida,
} from '../generated/prisma/enums';
import { InventarioService } from '../inventario/inventario.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  IndicadoresDto,
  IndicadorSaborDto,
  SalidaPorCanalDto,
} from './dto/indicadores.dto';
import { RangoIndicadoresDto } from './dto/rango-indicadores.dto';

const DIAS_POR_DEFECTO = 30;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

interface Acumulado {
  producido: number;
  salido: number;
  merma: number;
}

function porcentaje(parte: number, total: number): string {
  return total === 0 ? '0.0' : ((parte / total) * 100).toFixed(1);
}

function cobertura(stock: number, salido: number, dias: number): number | null {
  if (salido <= 0 || stock <= 0) {
    return null;
  }

  return Math.floor(stock / (salido / dias));
}

function acumuladoDe(mapa: Map<string, Acumulado>, saborId: string): Acumulado {
  const existente = mapa.get(saborId);

  if (existente !== undefined) {
    return existente;
  }

  const nuevo: Acumulado = { producido: 0, salido: 0, merma: 0 };

  mapa.set(saborId, nuevo);

  return nuevo;
}

@Injectable()
export class IndicadoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventarioService: InventarioService,
  ) {}

  async calcular(rango: RangoIndicadoresDto): Promise<IndicadoresDto> {
    const hasta =
      rango.hasta === undefined ? fechaDeHoy() : aFecha(rango.hasta);
    const desde =
      rango.desde === undefined
        ? new Date(
            hasta.getTime() - (DIAS_POR_DEFECTO - 1) * MILISEGUNDOS_POR_DIA,
          )
        : aFecha(rango.desde);

    const dias = Math.max(
      1,
      Math.round((hasta.getTime() - desde.getTime()) / MILISEGUNDOS_POR_DIA) +
        1,
    );

    const fecha = { gte: desde, lte: hasta };

    const [stockPorSabor, producciones, detalles, mermas] = await Promise.all([
      this.inventarioService.stockPorSabor(),
      this.prisma.produccion.findMany({
        where: { fecha, estado: EstadoProduccion.EMBOLSADA },
        select: {
          saborId: true,
          cantidadObtenida: true,
          cantidadEmbolsada: true,
        },
      }),
      this.prisma.salidaDetalle.findMany({
        where: { salida: { fecha } },
        select: {
          saborId: true,
          cantidad: true,
          salida: { select: { tipo: true } },
        },
      }),
      this.prisma.merma.findMany({
        where: { fecha },
        select: { saborId: true, cantidad: true, origen: true },
      }),
    ]);

    const acumulados = new Map<string, Acumulado>();
    const canales = new Map<TipoSalida, number>();

    let obtenido = 0;
    let embolsado = 0;

    for (const produccion of producciones) {
      const aptas = produccion.cantidadEmbolsada ?? 0;

      obtenido += produccion.cantidadObtenida;
      embolsado += aptas;
      acumuladoDe(acumulados, produccion.saborId).producido += aptas;
    }

    let salidas = 0;

    for (const detalle of detalles) {
      salidas += detalle.cantidad;
      acumuladoDe(acumulados, detalle.saborId).salido += detalle.cantidad;
      canales.set(
        detalle.salida.tipo,
        (canales.get(detalle.salida.tipo) ?? 0) + detalle.cantidad,
      );
    }

    let mermaEnAlmacen = 0;
    let mermaEnProceso = 0;

    for (const merma of mermas) {
      acumuladoDe(acumulados, merma.saborId).merma += merma.cantidad;

      if (merma.origen === OrigenMerma.STOCK) {
        mermaEnAlmacen += merma.cantidad;
      } else {
        mermaEnProceso += merma.cantidad;
      }
    }

    const sabores: IndicadorSaborDto[] = stockPorSabor.map((sabor) => {
      const acumulado = acumulados.get(sabor.saborId) ?? {
        producido: 0,
        salido: 0,
        merma: 0,
      };

      return {
        saborId: sabor.saborId,
        nombre: sabor.nombre,
        abreviatura: sabor.abreviatura,
        stock: sabor.stock,
        stockMinimo: sabor.stockMinimo,
        estado: sabor.estado,
        producido: acumulado.producido,
        salido: acumulado.salido,
        merma: acumulado.merma,
        cobertura: cobertura(sabor.stock, acumulado.salido, dias),
      };
    });

    const stockTotal = sabores.reduce((suma, sabor) => suma + sabor.stock, 0);
    const mermaTotal = mermaEnAlmacen + mermaEnProceso;

    return {
      desde: aTextoIso(desde),
      hasta: aTextoIso(hasta),
      dias,
      produccion: {
        obtenido,
        embolsado,
        merma: obtenido - embolsado,
        rendimiento: porcentaje(embolsado, obtenido),
      },
      salidas,
      salidasPorCanal: this.ordenarCanales(canales),
      mermas: {
        total: mermaTotal,
        enAlmacen: mermaEnAlmacen,
        enProceso: mermaEnProceso,
        porcentaje: porcentaje(mermaTotal, obtenido),
      },
      stock: {
        total: stockTotal,
        cobertura: cobertura(stockTotal, salidas, dias),
      },
      sabores,
    };
  }

  private ordenarCanales(
    canales: Map<TipoSalida, number>,
  ): SalidaPorCanalDto[] {
    return [...canales.entries()]
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((uno, otro) => otro.cantidad - uno.cantidad);
  }
}
