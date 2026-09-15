const ZONA = 'America/Lima';

const FORMATO_ISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function aFecha(valor: string): Date {
  return new Date(`${valor.slice(0, 10)}T00:00:00.000Z`);
}

export function fechaDeHoy(): Date {
  return aFecha(FORMATO_ISO.format(new Date()));
}

export function aTextoIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function ddmmaa(fecha: Date): string {
  const iso = aTextoIso(fecha);

  return `${iso.slice(8, 10)}${iso.slice(5, 7)}${iso.slice(2, 4)}`;
}

export function rangoDeFechas(
  desde?: string,
  hasta?: string,
): { gte?: Date; lte?: Date } | undefined {
  if (desde === undefined && hasta === undefined) {
    return undefined;
  }

  return {
    ...(desde === undefined ? {} : { gte: aFecha(desde) }),
    ...(hasta === undefined ? {} : { lte: aFecha(hasta) }),
  };
}
