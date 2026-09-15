import { Injectable, NotFoundException } from '@nestjs/common';
import { aTextoIso, ddmmaa, rangoDeFechas } from '../common/fechas/fecha';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListarLotesDto } from './dto/listar-lotes.dto';
import { LoteDto } from './dto/lote.dto';

const LIMITE_POR_DEFECTO = 100;

const SELECCION_LOTE = {
  id: true,
  codigo: true,
  saborId: true,
  fechaProduccion: true,
  correlativo: true,
  cantidadIngresada: true,
  stockRestante: true,
  estado: true,
  produccionId: true,
  creadoEn: true,
  sabor: { select: { nombre: true } },
  produccion: {
    select: { responsable: { select: { nombres: true, apellidos: true } } },
  },
} satisfies Prisma.LoteSelect;

type LoteSeleccionado = Prisma.LoteGetPayload<{
  select: typeof SELECCION_LOTE;
}>;

interface FilaCorrelativo {
  siguiente: number;
}

export interface DatosLoteNuevo {
  saborId: string;
  abreviatura: string;
  fecha: Date;
  produccionId: string;
}

function aDto(lote: LoteSeleccionado): LoteDto {
  const { nombres, apellidos } = lote.produccion.responsable;

  return {
    id: lote.id,
    codigo: lote.codigo,
    saborId: lote.saborId,
    sabor: lote.sabor.nombre,
    fechaProduccion: lote.fechaProduccion,
    correlativo: lote.correlativo,
    cantidadIngresada: lote.cantidadIngresada,
    stockRestante: lote.stockRestante,
    estado: lote.estado,
    produccionId: lote.produccionId,
    responsable: `${nombres} ${apellidos}`,
    creadoEn: lote.creadoEn,
  };
}

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

  async generar(
    tx: Prisma.TransactionClient,
    datos: DatosLoteNuevo,
  ): Promise<{ id: string; codigo: string }> {
    const clave = `${datos.saborId}:${aTextoIso(datos.fecha)}`;

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${clave})::bigint)`;

    const [fila] = await tx.$queryRaw<FilaCorrelativo[]>`
      SELECT COALESCE(MAX(correlativo), 0) + 1 AS siguiente
      FROM lote
      WHERE sabor_id = ${datos.saborId}
        AND fecha_produccion = ${aTextoIso(datos.fecha)}::date
    `;

    const correlativo = fila?.siguiente ?? 1;
    const codigo = `${datos.abreviatura}-${ddmmaa(datos.fecha)}-${String(
      correlativo,
    ).padStart(2, '0')}`;

    const lote = await tx.lote.create({
      data: {
        codigo,
        saborId: datos.saborId,
        produccionId: datos.produccionId,
        fechaProduccion: datos.fecha,
        correlativo,
      },
      select: { id: true, codigo: true },
    });

    return lote;
  }

  async listar(filtros: ListarLotesDto): Promise<LoteDto[]> {
    const lotes = await this.prisma.lote.findMany({
      where: {
        saborId: filtros.saborId,
        estado: filtros.estado,
        stockRestante: filtros.conStock === true ? { gt: 0 } : undefined,
        fechaProduccion: rangoDeFechas(filtros.desde, filtros.hasta),
      },
      orderBy: [{ fechaProduccion: 'desc' }, { correlativo: 'desc' }],
      take: filtros.limite ?? LIMITE_POR_DEFECTO,
      select: SELECCION_LOTE,
    });

    return lotes.map(aDto);
  }

  async obtener(id: string): Promise<LoteDto> {
    const lote = await this.prisma.lote.findUnique({
      where: { id },
      select: SELECCION_LOTE,
    });

    if (lote === null) {
      throw new NotFoundException('El lote no existe');
    }

    return aDto(lote);
  }

  async porCodigo(codigo: string): Promise<LoteDto> {
    const lote = await this.prisma.lote.findUnique({
      where: { codigo },
      select: SELECCION_LOTE,
    });

    if (lote === null) {
      throw new NotFoundException('No hay ningún lote con ese código');
    }

    return aDto(lote);
  }
}
