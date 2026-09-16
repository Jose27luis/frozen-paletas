import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Indicadores } from './indicadores';
import { Panel } from './modelos';
import { aParametros } from './parametros';

@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly http = inject(HttpClient);

  resumen(): Promise<Panel> {
    return firstValueFrom(this.http.get<Panel>('/api/panel'));
  }

  indicadores(desde: string, hasta: string): Promise<Indicadores> {
    return firstValueFrom(
      this.http.get<Indicadores>('/api/panel/indicadores', {
        params: aParametros({ desde, hasta }),
      }),
    );
  }
}
