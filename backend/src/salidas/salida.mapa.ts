import { Prisma } from '../generated/prisma/client';
import { SalidaDetalleDto, SalidaDto } from './dto/salida.dto';

export const SELECCION_SALIDA = {
  id: true,
  fecha: true,
  tipo: true,
  listaPrecios: true,
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

export type SalidaSeleccionada = Prisma.SalidaGetPayload<{
  select: typeof SELECCION_SALIDA;
}>;

type DetalleSeleccionado = SalidaSeleccionada['detalles'][number];

function aDetalleDto(detalle: DetalleSeleccionado): SalidaDetalleDto {
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

function importeDe(detalles: DetalleSeleccionado[]): Prisma.Decimal {
  return detalles.reduce(
    (suma, detalle) =>
      suma.plus(
        (detalle.precioUnitario ?? new Prisma.Decimal(0)).times(
          detalle.cantidad,
        ),
      ),
    new Prisma.Decimal(0),
  );
}

export function aSalidaDto(salida: SalidaSeleccionada): SalidaDto {
  return {
    id: salida.id,
    fecha: salida.fecha,
    tipo: salida.tipo,
    listaPrecios: salida.listaPrecios,
    destinoId: salida.destinoId,
    destino: salida.destino?.nombre ?? null,
    motivo: salida.motivo,
    cantidadTotal: salida.detalles.reduce(
      (suma, detalle) => suma + detalle.cantidad,
      0,
    ),
    importe: importeDe(salida.detalles).toFixed(2),
    usuario: `${salida.usuario.nombres} ${salida.usuario.apellidos}`,
    detalles: salida.detalles.map(aDetalleDto),
    creadoEn: salida.creadoEn,
  };
}
