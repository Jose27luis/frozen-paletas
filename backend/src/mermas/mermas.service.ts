import { Injectable } from '@nestjs/common';
import { aFecha, fechaDeHoy, rangoDeFechas } from '../common/fechas/fecha';
import { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { Prisma } from '../generated/prisma/client';
import { OrigenMerma, TipoMovimiento } from '../generated/prisma/enums';
import { MovimientosService } from '../inventario/movimientos.service';
import { PrismaService } from '../prisma/prisma.service';
import { SaboresService } from '../sabores/sabores.service';
import { CausasService } from './causas.service';
import { ListarMermasDto } from './dto/listar-mermas.dto';
import { MermaDto } from './dto/merma.dto';
import { RegistrarMermaDto } from './dto/registrar-merma.dto';
import { aMermaDto, SELECCION_MERMA } from './merma.mapa';

const LIMITE_POR_DEFECTO = 100;

export interface DatosMermaDeProduccion {
  saborId: string;
  produccionId: string;
  cantidad: number;
  causaId: string;
  observacion?: string;
  fecha: Date;
  usuarioId: string;
  claveIdempotencia: string;
}

@Injectable()
export class MermasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saboresService: SaboresService,
    private readonly causasService: CausasService,
    private readonly movimientosService: MovimientosService,
  ) {}

  async registrar(
    actor: UsuarioAutenticado,
    datos: RegistrarMermaDto,
  ): Promise<MermaDto> {
    const yaRegistrada = await this.buscarPorClave(
      actor.id,
      datos.claveIdempotencia,
    );

    if (yaRegistrada !== null) {
      return yaRegistrada;
    }

    await this.saboresService.exigirSaborActivo(datos.saborId);
    await this.causasService.exigirCausaUsable(
      datos.causaId,
      datos.observacion,
    );

    const fecha =
      datos.fecha === undefined ? fechaDeHoy() : aFecha(datos.fecha);

    const merma = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.merma.create({
        data: {
          fecha,
          saborId: datos.saborId,
          loteId: datos.loteId,
          cantidad: datos.cantidad,
          causaId: datos.causaId,
          origen: OrigenMerma.STOCK,
          observacion: datos.observacion,
          usuarioId: actor.id,
          claveIdempotencia: datos.claveIdempotencia,
        },
        select: { id: true },
      });

      const asignaciones = await this.movimientosService.descontar(tx, {
        saborId: datos.saborId,
        cantidad: datos.cantidad,
        fecha,
        usuarioId: actor.id,
        tipo: TipoMovimiento.MERMA,
        referenciaTipo: 'merma',
        referenciaId: creada.id,
        loteId: datos.loteId,
        motivo: datos.observacion,
      });

      const [primera] = asignaciones;

      if (datos.loteId === undefined && primera !== undefined) {
        await tx.merma.update({
          where: { id: creada.id },
          data: { loteId: primera.loteId },
        });
      }

      return tx.merma.findUniqueOrThrow({
        where: { id: creada.id },
        select: SELECCION_MERMA,
      });
    });

    return aMermaDto(merma);
  }

  async registrarDeEmbolsado(
    tx: Prisma.TransactionClient,
    datos: DatosMermaDeProduccion,
  ): Promise<void> {
    await tx.merma.create({
      data: {
        fecha: datos.fecha,
        saborId: datos.saborId,
        produccionId: datos.produccionId,
        cantidad: datos.cantidad,
        causaId: datos.causaId,
        origen: OrigenMerma.EMBOLSADO,
        observacion: datos.observacion,
        usuarioId: datos.usuarioId,
        claveIdempotencia: datos.claveIdempotencia,
      },
    });
  }

  async listar(filtros: ListarMermasDto): Promise<MermaDto[]> {
    const mermas = await this.prisma.merma.findMany({
      where: {
        saborId: filtros.saborId,
        causaId: filtros.causaId,
        origen: filtros.origen,
        fecha: rangoDeFechas(filtros.desde, filtros.hasta),
      },
      orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }],
      take: filtros.limite ?? LIMITE_POR_DEFECTO,
      select: SELECCION_MERMA,
    });

    return mermas.map(aMermaDto);
  }

  private async buscarPorClave(
    usuarioId: string,
    claveIdempotencia: string,
  ): Promise<MermaDto | null> {
    const merma = await this.prisma.merma.findUnique({
      where: {
        usuarioId_claveIdempotencia: { usuarioId, claveIdempotencia },
      },
      select: SELECCION_MERMA,
    });

    return merma === null ? null : aMermaDto(merma);
  }
}
