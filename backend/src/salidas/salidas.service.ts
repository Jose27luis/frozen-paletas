import { Injectable, NotFoundException } from '@nestjs/common';
import { aFecha, fechaDeHoy, rangoDeFechas } from '../common/fechas/fecha';
import { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { DestinosService } from '../destinos/destinos.service';
import { ListaPrecios, TipoMovimiento } from '../generated/prisma/enums';
import { MovimientosService } from '../inventario/movimientos.service';
import { PrismaService } from '../prisma/prisma.service';
import { SaboresService } from '../sabores/sabores.service';
import { ListarSalidasDto } from './dto/listar-salidas.dto';
import { RegistrarSalidaDto } from './dto/registrar-salida.dto';
import { SalidaDto } from './dto/salida.dto';
import {
  exigirSalidaCoherente,
  listaHabitualDe,
  precioDe,
  precioDelCatalogo,
} from './reglas-salida';
import { aSalidaDto, SELECCION_SALIDA } from './salida.mapa';

const LIMITE_POR_DEFECTO = 100;

@Injectable()
export class SalidasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly saboresService: SaboresService,
    private readonly destinosService: DestinosService,
    private readonly movimientosService: MovimientosService,
  ) {}

  async registrar(
    actor: UsuarioAutenticado,
    datos: RegistrarSalidaDto,
  ): Promise<SalidaDto> {
    const yaRegistrada = await this.buscarPorClave(
      actor.id,
      datos.claveIdempotencia,
    );

    if (yaRegistrada !== null) {
      return yaRegistrada;
    }

    exigirSalidaCoherente(datos);

    if (datos.destinoId !== undefined) {
      await this.destinosService.exigirDestinoDelTipo(
        datos.destinoId,
        datos.tipo,
      );
    }

    const lista = datos.listaPrecios ?? listaHabitualDe(datos.tipo);
    const precios = await this.preciosDelCatalogo(datos, lista);
    const fecha =
      datos.fecha === undefined ? fechaDeHoy() : aFecha(datos.fecha);

    const salida = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.salida.create({
        data: {
          fecha,
          tipo: datos.tipo,
          listaPrecios: lista,
          destinoId: datos.destinoId,
          motivo: datos.motivo,
          usuarioId: actor.id,
          claveIdempotencia: datos.claveIdempotencia,
        },
        select: { id: true },
      });

      for (const linea of datos.detalles) {
        const asignaciones = await this.movimientosService.descontar(tx, {
          saborId: linea.saborId,
          cantidad: linea.cantidad,
          fecha,
          usuarioId: actor.id,
          tipo: TipoMovimiento.SALIDA,
          referenciaTipo: 'salida',
          referenciaId: creada.id,
          loteId: linea.loteId,
          motivo: datos.motivo,
        });

        await tx.salidaDetalle.createMany({
          data: asignaciones.map((asignacion) => ({
            salidaId: creada.id,
            saborId: linea.saborId,
            loteId: asignacion.loteId,
            cantidad: asignacion.cantidad,
            precioUnitario: precioDe(
              linea,
              datos.tipo,
              precios.get(linea.saborId) ?? null,
            ),
            loteManual: asignacion.manual,
          })),
        });
      }

      return tx.salida.findUniqueOrThrow({
        where: { id: creada.id },
        select: SELECCION_SALIDA,
      });
    });

    return aSalidaDto(salida);
  }

  async listar(filtros: ListarSalidasDto): Promise<SalidaDto[]> {
    const salidas = await this.prisma.salida.findMany({
      where: {
        tipo: filtros.tipo,
        destinoId: filtros.destinoId,
        fecha: rangoDeFechas(filtros.desde, filtros.hasta),
      },
      orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }],
      take: filtros.limite ?? LIMITE_POR_DEFECTO,
      select: SELECCION_SALIDA,
    });

    return salidas.map(aSalidaDto);
  }

  async obtener(id: string): Promise<SalidaDto> {
    const salida = await this.prisma.salida.findUnique({
      where: { id },
      select: SELECCION_SALIDA,
    });

    if (salida === null) {
      throw new NotFoundException('La salida no existe');
    }

    return aSalidaDto(salida);
  }

  private async preciosDelCatalogo(
    datos: RegistrarSalidaDto,
    lista: ListaPrecios,
  ): Promise<Map<string, string | null>> {
    const precios = new Map<string, string | null>();

    for (const linea of datos.detalles) {
      const sabor = await this.saboresService.exigirSaborActivo(linea.saborId);

      precios.set(linea.saborId, precioDelCatalogo(sabor, lista));
    }

    return precios;
  }

  private async buscarPorClave(
    usuarioId: string,
    claveIdempotencia: string,
  ): Promise<SalidaDto | null> {
    const salida = await this.prisma.salida.findUnique({
      where: {
        usuarioId_claveIdempotencia: { usuarioId, claveIdempotencia },
      },
      select: SELECCION_SALIDA,
    });

    return salida === null ? null : aSalidaDto(salida);
  }
}
