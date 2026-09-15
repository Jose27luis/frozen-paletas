import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { aFecha, fechaDeHoy, rangoDeFechas } from '../common/fechas/fecha';
import { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { Prisma } from '../generated/prisma/client';
import { EstadoProduccion } from '../generated/prisma/enums';
import { MovimientosService } from '../inventario/movimientos.service';
import { LotesService } from '../lotes/lotes.service';
import { CausasService } from '../mermas/causas.service';
import { MermasService } from '../mermas/mermas.service';
import { PrismaService } from '../prisma/prisma.service';
import { SaboresService } from '../sabores/sabores.service';
import { AnularProduccionDto } from './dto/anular-produccion.dto';
import { ListarProduccionesDto } from './dto/listar-producciones.dto';
import { ProduccionDto } from './dto/produccion.dto';
import { RegistrarEmbolsadoDto } from './dto/registrar-embolsado.dto';
import { RegistrarProduccionDto } from './dto/registrar-produccion.dto';

const LIMITE_POR_DEFECTO = 100;

const SELECCION_PRODUCCION = {
  id: true,
  fecha: true,
  saborId: true,
  cantidadObtenida: true,
  cantidadEmbolsada: true,
  estado: true,
  motivoAnulacion: true,
  embolsadoEn: true,
  creadoEn: true,
  sabor: { select: { nombre: true } },
  responsable: { select: { nombres: true, apellidos: true } },
  lote: { select: { id: true, codigo: true } },
} satisfies Prisma.ProduccionSelect;

type ProduccionSeleccionada = Prisma.ProduccionGetPayload<{
  select: typeof SELECCION_PRODUCCION;
}>;

function aDto(produccion: ProduccionSeleccionada): ProduccionDto {
  const { nombres, apellidos } = produccion.responsable;

  return {
    id: produccion.id,
    fecha: produccion.fecha,
    saborId: produccion.saborId,
    sabor: produccion.sabor.nombre,
    cantidadObtenida: produccion.cantidadObtenida,
    cantidadEmbolsada: produccion.cantidadEmbolsada,
    merma:
      produccion.cantidadEmbolsada === null
        ? null
        : produccion.cantidadObtenida - produccion.cantidadEmbolsada,
    estado: produccion.estado,
    loteId: produccion.lote?.id ?? null,
    lote: produccion.lote?.codigo ?? null,
    responsable: `${nombres} ${apellidos}`,
    motivoAnulacion: produccion.motivoAnulacion,
    embolsadoEn: produccion.embolsadoEn,
    creadoEn: produccion.creadoEn,
  };
}

@Injectable()
export class ProduccionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saboresService: SaboresService,
    private readonly lotesService: LotesService,
    private readonly movimientosService: MovimientosService,
    private readonly mermasService: MermasService,
    private readonly causasService: CausasService,
  ) {}

  async registrar(
    actor: UsuarioAutenticado,
    datos: RegistrarProduccionDto,
  ): Promise<ProduccionDto> {
    const yaRegistrada = await this.buscarPorClave(
      actor.id,
      datos.claveIdempotencia,
    );

    if (yaRegistrada !== null) {
      return yaRegistrada;
    }

    const sabor = await this.saboresService.exigirSaborActivo(datos.saborId);
    const fecha =
      datos.fecha === undefined ? fechaDeHoy() : aFecha(datos.fecha);

    const produccion = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.produccion.create({
        data: {
          fecha,
          saborId: datos.saborId,
          cantidadObtenida: datos.cantidadObtenida,
          responsableId: actor.id,
          claveIdempotencia: datos.claveIdempotencia,
        },
        select: { id: true },
      });

      await this.lotesService.generar(tx, {
        saborId: datos.saborId,
        abreviatura: sabor.abreviatura,
        fecha,
        produccionId: creada.id,
      });

      return tx.produccion.findUniqueOrThrow({
        where: { id: creada.id },
        select: SELECCION_PRODUCCION,
      });
    });

    return aDto(produccion);
  }

  async embolsar(
    actor: UsuarioAutenticado,
    id: string,
    datos: RegistrarEmbolsadoDto,
  ): Promise<ProduccionDto> {
    const produccion = await this.exigirProduccion(id);

    if (produccion.estado !== EstadoProduccion.REGISTRADA) {
      throw new ConflictException(
        produccion.estado === EstadoProduccion.EMBOLSADA
          ? 'Esta producción ya ingresó al stock; corrígela con un ajuste'
          : 'Esta producción está anulada',
      );
    }

    if (datos.cantidadEmbolsada > produccion.cantidadObtenida) {
      throw new BadRequestException(
        `No se puede embolsar más de lo producido: se obtuvieron ${produccion.cantidadObtenida} paletas`,
      );
    }

    const merma = produccion.cantidadObtenida - datos.cantidadEmbolsada;

    if (merma > 0 && datos.causaId === undefined) {
      throw new BadRequestException(
        'Falta indicar la causa de las paletas que no llegaron a embolsarse',
      );
    }

    if (datos.causaId !== undefined) {
      await this.causasService.exigirCausaUsable(
        datos.causaId,
        datos.observacion,
      );
    }

    const loteId = produccion.lote?.id;

    if (loteId === undefined) {
      throw new ConflictException('La producción no tiene lote asociado');
    }

    const actualizada = await this.prisma.$transaction(async (tx) => {
      await tx.produccion.update({
        where: { id },
        data: {
          cantidadEmbolsada: datos.cantidadEmbolsada,
          estado: EstadoProduccion.EMBOLSADA,
          embolsadoEn: new Date(),
        },
      });

      await this.movimientosService.registrarIngreso(tx, {
        saborId: produccion.saborId,
        loteId,
        cantidad: datos.cantidadEmbolsada,
        fecha: produccion.fecha,
        usuarioId: actor.id,
        referenciaTipo: 'produccion',
        referenciaId: id,
      });

      if (merma > 0 && datos.causaId !== undefined) {
        await this.mermasService.registrarDeEmbolsado(tx, {
          saborId: produccion.saborId,
          produccionId: id,
          cantidad: merma,
          causaId: datos.causaId,
          observacion: datos.observacion,
          fecha: produccion.fecha,
          usuarioId: actor.id,
          claveIdempotencia: randomUUID(),
        });
      }

      return tx.produccion.findUniqueOrThrow({
        where: { id },
        select: SELECCION_PRODUCCION,
      });
    });

    return aDto(actualizada);
  }

  async anular(id: string, datos: AnularProduccionDto): Promise<ProduccionDto> {
    const produccion = await this.exigirProduccion(id);

    if (produccion.estado !== EstadoProduccion.REGISTRADA) {
      throw new ConflictException(
        produccion.estado === EstadoProduccion.EMBOLSADA
          ? 'Esta producción ya ingresó al stock; corrígela con un ajuste'
          : 'Esta producción ya está anulada',
      );
    }

    const anulada = await this.prisma.produccion.update({
      where: { id },
      data: {
        estado: EstadoProduccion.ANULADA,
        motivoAnulacion: datos.motivo,
      },
      select: SELECCION_PRODUCCION,
    });

    return aDto(anulada);
  }

  async listar(filtros: ListarProduccionesDto): Promise<ProduccionDto[]> {
    const producciones = await this.prisma.produccion.findMany({
      where: {
        saborId: filtros.saborId,
        estado: filtros.estado,
        fecha: rangoDeFechas(filtros.desde, filtros.hasta),
      },
      orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }],
      take: filtros.limite ?? LIMITE_POR_DEFECTO,
      select: SELECCION_PRODUCCION,
    });

    return producciones.map(aDto);
  }

  async pendientesDeEmbolsar(): Promise<ProduccionDto[]> {
    const producciones = await this.prisma.produccion.findMany({
      where: { estado: EstadoProduccion.REGISTRADA },
      orderBy: [{ fecha: 'asc' }, { creadoEn: 'asc' }],
      select: SELECCION_PRODUCCION,
    });

    return producciones.map(aDto);
  }

  async obtener(id: string): Promise<ProduccionDto> {
    return aDto(await this.exigirProduccion(id));
  }

  private async exigirProduccion(id: string): Promise<ProduccionSeleccionada> {
    const produccion = await this.prisma.produccion.findUnique({
      where: { id },
      select: SELECCION_PRODUCCION,
    });

    if (produccion === null) {
      throw new NotFoundException('La producción no existe');
    }

    return produccion;
  }

  private async buscarPorClave(
    responsableId: string,
    claveIdempotencia: string,
  ): Promise<ProduccionDto | null> {
    const produccion = await this.prisma.produccion.findUnique({
      where: {
        responsableId_claveIdempotencia: { responsableId, claveIdempotencia },
      },
      select: SELECCION_PRODUCCION,
    });

    return produccion === null ? null : aDto(produccion);
  }
}
