import { Prisma } from '../generated/prisma/client';
import { ProduccionDto } from './dto/produccion.dto';

export const SELECCION_PRODUCCION = {
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

export type ProduccionSeleccionada = Prisma.ProduccionGetPayload<{
  select: typeof SELECCION_PRODUCCION;
}>;

export function aProduccionDto(
  produccion: ProduccionSeleccionada,
): ProduccionDto {
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
