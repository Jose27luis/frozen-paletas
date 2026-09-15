import { Injectable } from '@nestjs/common';
import { InventarioService } from '../inventario/inventario.service';
import { MermasService } from '../mermas/mermas.service';
import { ProduccionService } from '../produccion/produccion.service';
import { SalidasService } from '../salidas/salidas.service';
import { PanelDto } from './dto/panel.dto';

const RECIENTES = 10;

@Injectable()
export class PanelService {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly produccionService: ProduccionService,
    private readonly salidasService: SalidasService,
    private readonly mermasService: MermasService,
  ) {}

  async resumen(): Promise<PanelDto> {
    const [
      inventario,
      aReponer,
      pendientes,
      produccionesRecientes,
      salidasRecientes,
      mermasRecientes,
    ] = await Promise.all([
      this.inventarioService.resumen(),
      this.inventarioService.aReponer(),
      this.produccionService.pendientesDeEmbolsar(),
      this.produccionService.listar({ limite: RECIENTES }),
      this.salidasService.listar({ limite: RECIENTES }),
      this.mermasService.listar({ limite: RECIENTES }),
    ]);

    return {
      stockTotal: inventario.total,
      sabores: inventario.sabores,
      aReponer,
      pendientesDeEmbolsar: pendientes.length,
      produccionesRecientes,
      salidasRecientes,
      mermasRecientes,
    };
  }
}
