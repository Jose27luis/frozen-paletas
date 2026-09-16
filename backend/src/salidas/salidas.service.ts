import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { aFecha, fechaDeHoy, rangoDeFechas } from '../common/fechas/fecha';
import { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { DestinosService } from '../destinos/destinos.service';
import { Prisma } from '../generated/prisma/client';
import { TipoMovimiento, TipoSalida } from '../generated/prisma/enums';
import { MovimientosService } from '../inventario/movimientos.service';
import { PrismaService } from '../prisma/prisma.service';
import { SaboresService } from '../sabores/sabores.service';
import { ListarSalidasDto } from './dto/listar-salidas.dto';
import { LineaSalidaDto, RegistrarSalidaDto } from './dto/registrar-salida.dto';
import { SalidaDetalleDto, SalidaDto } from './dto/salida.dto';

const LIMITE_POR_DEFECTO = 100;
const PEDIDO_MINIMO_DELIVERY = 12;
const PRECIO_DELIVERY = new Prisma.Decimal('5.00');

const TIPOS_CON_DESTINO_OBLIGATORIO: readonly TipoSalida[] = [
  TipoSalida.PDV,
  TipoSalida.MAYORISTA,
];

const SELECCION_SALIDA = {
  id: true,
  fecha: true,
  tipo: true,
  destinoId: true,
  motivo: true,
  creadoEn: true,
  destino: { select: { nombre: true } },
  usuario: { select: { nombres: true, apellidos: true } },
  detalles: {
    select: {
      saborId: true,
      loteId: true,
      cantidad: true,
      precioUnitario: true,
      loteManual: true,
      sabor: { select: { nombre: true } },
      lote: { select: { codigo: true } },
    },
  },
} satisfies Prisma.SalidaSelect;

type SalidaSeleccionada = Prisma.SalidaGetPayload<{
  select: typeof SELECCION_SALIDA;
}>;

function aDetalleDto(
  detalle: SalidaSeleccionada['detalles'][number],
): SalidaDetalleDto {
  return {
    saborId: detalle.saborId,
    sabor: detalle.sabor.nombre,
    loteId: detalle.loteId,
    lote: detalle.lote.codigo,
    cantidad: detalle.cantidad,
    precioUnitario: detalle.precioUnitario?.toFixed(2) ?? null,
    loteManual: detalle.loteManual,
  };
}

function aDto(salida: SalidaSeleccionada): SalidaDto {
  const importe = salida.detalles.reduce(
    (suma, detalle) =>
      suma.plus(
        (detalle.precioUnitario ?? new Prisma.Decimal(0)).times(
          detalle.cantidad,
        ),
      ),
    new Prisma.Decimal(0),
  );

  return {
    id: salida.id,
    fecha: salida.fecha,
    tipo: salida.tipo,
    destinoId: salida.destinoId,
    destino: salida.destino?.nombre ?? null,
    motivo: salida.motivo,
    cantidadTotal: salida.detalles.reduce(
      (suma, detalle) => suma + detalle.cantidad,
      0,
    ),
    importe: importe.toFixed(2),
    usuario: `${salida.usuario.nombres} ${salida.usuario.apellidos}`,
    detalles: salida.detalles.map(aDetalleDto),
    creadoEn: salida.creadoEn,
  };
}

function precioDe(
  linea: LineaSalidaDto,
  tipo: TipoSalida,
  precioDelSabor: string | null,
): Prisma.Decimal | null {
  if (linea.precioUnitario !== undefined) {
    return new Prisma.Decimal(linea.precioUnitario);
  }

  if (precioDelSabor !== null) {
    return new Prisma.Decimal(precioDelSabor);
  }

  return tipo === TipoSalida.DELIVERY ? PRECIO_DELIVERY : null;
}

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

    this.exigirDestinoCoherente(datos);
    this.exigirLineasSinRepetir(datos.detalles);
    this.exigirPedidoMinimo(datos);

    if (datos.destinoId !== undefined) {
      await this.destinosService.exigirDestinoDelTipo(
        datos.destinoId,
        datos.tipo,
      );
    }

    const precios = new Map<string, string | null>();

    for (const linea of datos.detalles) {
      const sabor = await this.saboresService.exigirSaborActivo(linea.saborId);

      precios.set(linea.saborId, sabor.precio);
    }

    const fecha =
      datos.fecha === undefined ? fechaDeHoy() : aFecha(datos.fecha);

    const salida = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.salida.create({
        data: {
          fecha,
          tipo: datos.tipo,
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

    return aDto(salida);
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

    return salidas.map(aDto);
  }

  async obtener(id: string): Promise<SalidaDto> {
    const salida = await this.prisma.salida.findUnique({
      where: { id },
      select: SELECCION_SALIDA,
    });

    if (salida === null) {
      throw new NotFoundException('La salida no existe');
    }

    return aDto(salida);
  }

  private exigirDestinoCoherente(datos: RegistrarSalidaDto): void {
    if (
      TIPOS_CON_DESTINO_OBLIGATORIO.includes(datos.tipo) &&
      datos.destinoId === undefined
    ) {
      throw new BadRequestException(
        'Falta indicar el punto de venta o el cliente que recibe el producto',
      );
    }

    if (datos.destinoId === undefined && datos.motivo === undefined) {
      throw new BadRequestException(
        'Sin destino registrado hay que explicar a dónde va el producto',
      );
    }
  }

  private exigirLineasSinRepetir(detalles: LineaSalidaDto[]): void {
    const vistas = new Set<string>();

    for (const linea of detalles) {
      const clave = `${linea.saborId}:${linea.loteId ?? 'peps'}`;

      if (vistas.has(clave)) {
        throw new BadRequestException(
          'Hay un sabor repetido en el detalle: súmalo en una sola línea',
        );
      }

      vistas.add(clave);
    }
  }

  private exigirPedidoMinimo(datos: RegistrarSalidaDto): void {
    if (datos.tipo !== TipoSalida.DELIVERY) {
      return;
    }

    const total = datos.detalles.reduce(
      (suma, linea) => suma + linea.cantidad,
      0,
    );

    if (total < PEDIDO_MINIMO_DELIVERY) {
      throw new BadRequestException(
        `El pedido mínimo de delivery es de ${PEDIDO_MINIMO_DELIVERY} paletas`,
      );
    }
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

    return salida === null ? null : aDto(salida);
  }
}
