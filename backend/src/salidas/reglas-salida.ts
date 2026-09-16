import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { ListaPrecios, TipoSalida } from '../generated/prisma/enums';
import { SaborDto } from '../sabores/dto/sabor.dto';
import { LineaSalidaDto, RegistrarSalidaDto } from './dto/registrar-salida.dto';

export const PEDIDO_MINIMO_DELIVERY = 12;
export const PRECIO_DELIVERY = new Prisma.Decimal('5.00');

const TIPOS_CON_DESTINO_OBLIGATORIO: readonly TipoSalida[] = [
  TipoSalida.PDV,
  TipoSalida.MAYORISTA,
];

const CANALES_POR_MAYOR: readonly TipoSalida[] = [
  TipoSalida.PDV,
  TipoSalida.MAYORISTA,
];

export function listaHabitualDe(tipo: TipoSalida): ListaPrecios {
  return CANALES_POR_MAYOR.includes(tipo)
    ? ListaPrecios.MAYOR
    : ListaPrecios.UNIDAD;
}

export function precioDelCatalogo(
  sabor: SaborDto,
  lista: ListaPrecios,
): string | null {
  return lista === ListaPrecios.MAYOR ? sabor.precioMayor : sabor.precioUnidad;
}

export function precioDe(
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

export function exigirSalidaCoherente(datos: RegistrarSalidaDto): void {
  exigirDestino(datos);
  exigirLineasSinRepetir(datos.detalles);
  exigirPedidoMinimo(datos);
}

function exigirDestino(datos: RegistrarSalidaDto): void {
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

function exigirLineasSinRepetir(detalles: LineaSalidaDto[]): void {
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

function exigirPedidoMinimo(datos: RegistrarSalidaDto): void {
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
