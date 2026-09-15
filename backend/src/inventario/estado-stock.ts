export enum EstadoStock {
  DISPONIBLE = 'DISPONIBLE',
  REPONER = 'REPONER',
  AGOTADO = 'AGOTADO',
}

export function estadoDelStock(
  stock: number,
  stockMinimo: number,
): EstadoStock {
  if (stock <= 0) {
    return EstadoStock.AGOTADO;
  }

  return stock <= stockMinimo ? EstadoStock.REPONER : EstadoStock.DISPONIBLE;
}
