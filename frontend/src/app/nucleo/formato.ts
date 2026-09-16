const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fechaCorta(valor: string): string {
  const iso = valor.slice(0, 10);
  const dia = iso.slice(8, 10);
  const mes = MESES[Number(iso.slice(5, 7)) - 1] ?? '';

  return `${dia} ${mes}`;
}

export function fechaLarga(valor: string): string {
  return `${fechaCorta(valor)} ${valor.slice(0, 4)}`;
}

export function hoyEnIso(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return partes;
}

export function haceDias(dias: number): string {
  const hoy = new Date(`${hoyEnIso()}T00:00:00.000Z`);

  hoy.setUTCDate(hoy.getUTCDate() - (dias - 1));

  return hoy.toISOString().slice(0, 10);
}

export function miles(cantidad: number): string {
  return cantidad.toLocaleString('es-PE');
}

export function paletas(cantidad: number): string {
  return cantidad === 1 ? '1 paleta' : `${cantidad.toLocaleString('es-PE')} paletas`;
}

export function soles(importe: string): string {
  return `S/ ${Number(importe).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}
