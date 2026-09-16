import { Prisma } from '../generated/prisma/client';
import { OrigenMerma } from '../generated/prisma/enums';
import { MermaDto } from './dto/merma.dto';

export const SELECCION_MERMA = {
  id: true,
  fecha: true,
  saborId: true,
  loteId: true,
  cantidad: true,
  origen: true,
  observacion: true,
  creadoEn: true,
  sabor: { select: { nombre: true } },
  lote: { select: { codigo: true } },
  causa: { select: { nombre: true } },
  usuario: { select: { nombres: true, apellidos: true } },
} satisfies Prisma.MermaSelect;

export type MermaSeleccionada = Prisma.MermaGetPayload<{
  select: typeof SELECCION_MERMA;
}>;

export function aMermaDto(merma: MermaSeleccionada): MermaDto {
  return {
    id: merma.id,
    fecha: merma.fecha,
    saborId: merma.saborId,
    sabor: merma.sabor.nombre,
    loteId: merma.loteId,
    lote: merma.lote?.codigo ?? null,
    cantidad: merma.cantidad,
    causa: merma.causa.nombre,
    origen: merma.origen,
    observacion: merma.observacion,
    descontoStock: merma.origen === OrigenMerma.STOCK,
    responsable: `${merma.usuario.nombres} ${merma.usuario.apellidos}`,
    creadoEn: merma.creadoEn,
  };
}
