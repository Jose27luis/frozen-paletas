import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { EstadoLote, TipoMovimiento } from '../generated/prisma/enums';

export interface DatosIngreso {
  saborId: string;
  loteId: string;
  cantidad: number;
  fecha: Date;
  usuarioId: string;
  referenciaTipo: string;
  referenciaId: string;
}

export interface DatosDescuento {
  saborId: string;
  cantidad: number;
  fecha: Date;
  usuarioId: string;
  tipo: TipoMovimiento;
  referenciaTipo: string;
  referenciaId: string;
  loteId?: string;
  motivo?: string;
}

export interface DatosAjuste {
  saborId: string;
  loteId: string | null;
  cantidad: number;
  fecha: Date;
  usuarioId: string;
  motivo: string;
  referenciaTipo: string;
  referenciaId: string;
}

export interface AsignacionLote {
  loteId: string;
  cantidad: number;
  manual: boolean;
}

interface FilaLote {
  id: string;
  stock_restante: number;
  cantidad_ingresada: number;
}

interface Reparto extends AsignacionLote {
  restante: number;
  ingresada: number;
}

function estadoTras(restante: number, ingresada: number): EstadoLote {
  if (restante <= 0) {
    return EstadoLote.AGOTADO;
  }

  return restante < ingresada ? EstadoLote.PARCIAL : EstadoLote.ABIERTO;
}

@Injectable()
export class MovimientosService {
  async registrarIngreso(
    tx: Prisma.TransactionClient,
    datos: DatosIngreso,
  ): Promise<void> {
    await tx.lote.update({
      where: { id: datos.loteId },
      data: {
        cantidadIngresada: datos.cantidad,
        stockRestante: datos.cantidad,
        estado: estadoTras(datos.cantidad, datos.cantidad),
      },
    });

    await tx.movimiento.create({
      data: {
        tipo: TipoMovimiento.INGRESO_PRODUCCION,
        fecha: datos.fecha,
        saborId: datos.saborId,
        loteId: datos.loteId,
        cantidad: datos.cantidad,
        usuarioId: datos.usuarioId,
        referenciaTipo: datos.referenciaTipo,
        referenciaId: datos.referenciaId,
      },
    });
  }

  async descontar(
    tx: Prisma.TransactionClient,
    datos: DatosDescuento,
  ): Promise<AsignacionLote[]> {
    const disponibles = await this.bloquearLotes(tx, datos);
    const repartos = this.repartir(disponibles, datos);

    for (const reparto of repartos) {
      await tx.lote.update({
        where: { id: reparto.loteId },
        data: {
          stockRestante: reparto.restante,
          estado: estadoTras(reparto.restante, reparto.ingresada),
        },
      });

      await tx.movimiento.create({
        data: {
          tipo: datos.tipo,
          fecha: datos.fecha,
          saborId: datos.saborId,
          loteId: reparto.loteId,
          cantidad: -reparto.cantidad,
          usuarioId: datos.usuarioId,
          referenciaTipo: datos.referenciaTipo,
          referenciaId: datos.referenciaId,
          motivo: datos.motivo,
        },
      });
    }

    return repartos.map((reparto) => ({
      loteId: reparto.loteId,
      cantidad: reparto.cantidad,
      manual: reparto.manual,
    }));
  }

  async registrarAjuste(
    tx: Prisma.TransactionClient,
    datos: DatosAjuste,
  ): Promise<string> {
    if (datos.loteId !== null) {
      const [lote] = await tx.$queryRaw<FilaLote[]>`
        SELECT id, stock_restante, cantidad_ingresada
        FROM lote
        WHERE id = ${datos.loteId}
        FOR UPDATE
      `;

      if (lote === undefined) {
        throw new ConflictException('El lote del ajuste no existe');
      }

      const restante = lote.stock_restante + datos.cantidad;

      if (restante < 0) {
        throw new ConflictException(
          'El ajuste dejaría el lote con stock negativo',
        );
      }

      await tx.lote.update({
        where: { id: datos.loteId },
        data: {
          stockRestante: restante,
          estado: estadoTras(restante, lote.cantidad_ingresada),
        },
      });
    }

    const movimiento = await tx.movimiento.create({
      data: {
        tipo: TipoMovimiento.AJUSTE,
        fecha: datos.fecha,
        saborId: datos.saborId,
        loteId: datos.loteId,
        cantidad: datos.cantidad,
        usuarioId: datos.usuarioId,
        referenciaTipo: datos.referenciaTipo,
        referenciaId: datos.referenciaId,
        motivo: datos.motivo,
      },
      select: { id: true },
    });

    return movimiento.id;
  }

  private bloquearLotes(
    tx: Prisma.TransactionClient,
    datos: DatosDescuento,
  ): Promise<FilaLote[]> {
    if (datos.loteId !== undefined) {
      return tx.$queryRaw<FilaLote[]>`
        SELECT id, stock_restante, cantidad_ingresada
        FROM lote
        WHERE id = ${datos.loteId} AND sabor_id = ${datos.saborId}
        FOR UPDATE
      `;
    }

    return tx.$queryRaw<FilaLote[]>`
      SELECT id, stock_restante, cantidad_ingresada
      FROM lote
      WHERE sabor_id = ${datos.saborId} AND stock_restante > 0
      ORDER BY fecha_produccion ASC, correlativo ASC
      FOR UPDATE
    `;
  }

  private repartir(disponibles: FilaLote[], datos: DatosDescuento): Reparto[] {
    const manual = datos.loteId !== undefined;
    const total = disponibles.reduce(
      (suma, lote) => suma + lote.stock_restante,
      0,
    );

    if (total < datos.cantidad) {
      throw new ConflictException(
        manual
          ? `El lote elegido solo tiene ${total} paletas disponibles`
          : `No hay stock suficiente: quedan ${total} paletas de ese sabor`,
      );
    }

    const repartos: Reparto[] = [];
    let pendiente = datos.cantidad;

    for (const lote of disponibles) {
      if (pendiente === 0) {
        break;
      }

      const tomado = Math.min(pendiente, lote.stock_restante);

      repartos.push({
        loteId: lote.id,
        cantidad: tomado,
        manual,
        restante: lote.stock_restante - tomado,
        ingresada: lote.cantidad_ingresada,
      });

      pendiente -= tomado;
    }

    return repartos;
  }
}
