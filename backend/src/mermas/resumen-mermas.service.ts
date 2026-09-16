import { Injectable } from '@nestjs/common';
import { aFecha, aTextoIso, fechaDeHoy } from '../common/fechas/fecha';
import { OrigenMerma } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { RangoMermasDto } from './dto/rango-mermas.dto';
import { ResumenMermasDto } from './dto/resumen-mermas.dto';

const DIAS_POR_DEFECTO = 30;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

interface Conteo {
  cantidad: number;
  registros: number;
}

@Injectable()
export class ResumenMermasService {
  constructor(private readonly prisma: PrismaService) {}

  async calcular(rango: RangoMermasDto): Promise<ResumenMermasDto> {
    const hasta =
      rango.hasta === undefined ? fechaDeHoy() : aFecha(rango.hasta);
    const desde =
      rango.desde === undefined
        ? new Date(
            hasta.getTime() - (DIAS_POR_DEFECTO - 1) * MILISEGUNDOS_POR_DIA,
          )
        : aFecha(rango.desde);

    const mermas = await this.prisma.merma.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      select: {
        cantidad: true,
        origen: true,
        causa: { select: { nombre: true } },
        sabor: { select: { nombre: true } },
      },
    });

    const porCausa = new Map<string, Conteo>();
    const porSabor = new Map<string, number>();

    let enAlmacen = 0;
    let enProceso = 0;

    for (const merma of mermas) {
      const causa = porCausa.get(merma.causa.nombre) ?? {
        cantidad: 0,
        registros: 0,
      };

      causa.cantidad += merma.cantidad;
      causa.registros += 1;
      porCausa.set(merma.causa.nombre, causa);

      porSabor.set(
        merma.sabor.nombre,
        (porSabor.get(merma.sabor.nombre) ?? 0) + merma.cantidad,
      );

      if (merma.origen === OrigenMerma.STOCK) {
        enAlmacen += merma.cantidad;
      } else {
        enProceso += merma.cantidad;
      }
    }

    return {
      desde: aTextoIso(desde),
      hasta: aTextoIso(hasta),
      total: enAlmacen + enProceso,
      enAlmacen,
      enProceso,
      porCausa: [...porCausa.entries()]
        .map(([causa, datos]) => ({ causa, ...datos }))
        .sort((uno, otro) => otro.cantidad - uno.cantidad),
      porSabor: [...porSabor.entries()]
        .map(([sabor, cantidad]) => ({ sabor, cantidad }))
        .sort((uno, otro) => otro.cantidad - uno.cantidad),
    };
  }
}
