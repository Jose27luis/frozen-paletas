import { Injectable } from '@nestjs/common';
import { fechaDeHoy, rangoDeFechas } from '../common/fechas/fecha';
import { Prisma } from '../generated/prisma/client';
import { EstadoSabor } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ListarMovimientosDto } from './dto/listar-movimientos.dto';
import { MovimientoDto } from './dto/movimiento.dto';
import { InventarioDto, StockSaborDto } from './dto/stock-sabor.dto';
import { estadoDelStock, EstadoStock } from './estado-stock';

const LIMITE_POR_DEFECTO = 100;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const SELECCION_MOVIMIENTO = {
  id: true,
  tipo: true,
  fecha: true,
  saborId: true,
  loteId: true,
  cantidad: true,
  referenciaTipo: true,
  referenciaId: true,
  motivo: true,
  creadoEn: true,
  sabor: { select: { nombre: true } },
  lote: { select: { codigo: true } },
  usuario: { select: { nombres: true, apellidos: true } },
} satisfies Prisma.MovimientoSelect;

type MovimientoSeleccionado = Prisma.MovimientoGetPayload<{
  select: typeof SELECCION_MOVIMIENTO;
}>;

function aMovimientoDto(movimiento: MovimientoSeleccionado): MovimientoDto {
  return {
    id: movimiento.id,
    tipo: movimiento.tipo,
    fecha: movimiento.fecha,
    saborId: movimiento.saborId,
    sabor: movimiento.sabor.nombre,
    loteId: movimiento.loteId,
    lote: movimiento.lote?.codigo ?? null,
    cantidad: movimiento.cantidad,
    usuario: `${movimiento.usuario.nombres} ${movimiento.usuario.apellidos}`,
    referenciaTipo: movimiento.referenciaTipo,
    referenciaId: movimiento.referenciaId,
    motivo: movimiento.motivo,
    creadoEn: movimiento.creadoEn,
  };
}

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen(): Promise<InventarioDto> {
    const sabores = await this.stockPorSabor();

    return {
      total: sabores.reduce((suma, sabor) => suma + sabor.stock, 0),
      sabores,
    };
  }

  async stockPorSabor(): Promise<StockSaborDto[]> {
    const [sabores, sumas, lotes] = await Promise.all([
      this.prisma.sabor.findMany({
        where: { estado: { not: EstadoSabor.INACTIVO } },
        orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
        select: {
          id: true,
          nombre: true,
          abreviatura: true,
          categoria: true,
          estado: true,
          stockMinimo: true,
        },
      }),
      this.prisma.movimiento.groupBy({
        by: ['saborId'],
        _sum: { cantidad: true },
      }),
      this.prisma.lote.findMany({
        where: { stockRestante: { gt: 0 } },
        orderBy: [{ fechaProduccion: 'asc' }, { correlativo: 'asc' }],
        select: {
          saborId: true,
          codigo: true,
          fechaProduccion: true,
          stockRestante: true,
        },
      }),
    ]);

    const porSabor = new Map(
      sumas.map((suma) => [suma.saborId, suma._sum.cantidad ?? 0]),
    );

    const hoy = fechaDeHoy().getTime();

    return sabores.map((sabor) => {
      const stock = porSabor.get(sabor.id) ?? 0;
      const abiertos = lotes.filter((lote) => lote.saborId === sabor.id);
      const [antiguo] = abiertos;

      return {
        saborId: sabor.id,
        nombre: sabor.nombre,
        abreviatura: sabor.abreviatura,
        categoria: sabor.categoria,
        estadoSabor: sabor.estado,
        stock,
        stockMinimo: sabor.stockMinimo,
        estado: estadoDelStock(stock, sabor.stockMinimo),
        lotesAbiertos: abiertos.length,
        loteMasAntiguo:
          antiguo === undefined
            ? null
            : {
                codigo: antiguo.codigo,
                fecha: antiguo.fechaProduccion,
                stockRestante: antiguo.stockRestante,
                antiguedad: Math.max(
                  0,
                  Math.round(
                    (hoy - antiguo.fechaProduccion.getTime()) /
                      MILISEGUNDOS_POR_DIA,
                  ),
                ),
              },
      };
    });
  }

  async aReponer(): Promise<StockSaborDto[]> {
    const sabores = await this.stockPorSabor();

    return sabores
      .filter(
        (sabor) =>
          sabor.estadoSabor === EstadoSabor.ACTIVO &&
          sabor.estado !== EstadoStock.DISPONIBLE,
      )
      .sort((uno, otro) => uno.stock - otro.stock);
  }

  async stockDeSabor(saborId: string): Promise<number> {
    const suma = await this.prisma.movimiento.aggregate({
      where: { saborId },
      _sum: { cantidad: true },
    });

    return suma._sum.cantidad ?? 0;
  }

  async movimientos(filtros: ListarMovimientosDto): Promise<MovimientoDto[]> {
    const movimientos = await this.prisma.movimiento.findMany({
      where: {
        saborId: filtros.saborId,
        loteId: filtros.loteId,
        tipo: filtros.tipo,
        fecha: rangoDeFechas(filtros.desde, filtros.hasta),
      },
      orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }],
      take: filtros.limite ?? LIMITE_POR_DEFECTO,
      select: SELECCION_MOVIMIENTO,
    });

    return movimientos.map(aMovimientoDto);
  }
}
