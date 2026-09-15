import { HttpParams } from '@angular/common/http';

export type ValorFiltro = string | number | boolean | undefined;

export function aParametros(filtros: Record<string, ValorFiltro>): HttpParams {
  let parametros = new HttpParams();

  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== '') {
      parametros = parametros.set(clave, String(valor));
    }
  }

  return parametros;
}
