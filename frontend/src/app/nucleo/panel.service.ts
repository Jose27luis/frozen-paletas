import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Panel } from './modelos';

@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly http = inject(HttpClient);

  resumen(): Promise<Panel> {
    return firstValueFrom(this.http.get<Panel>('/api/panel'));
  }
}
