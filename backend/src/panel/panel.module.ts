import { Module } from '@nestjs/common';
import { InventarioModule } from '../inventario/inventario.module';
import { MermasModule } from '../mermas/mermas.module';
import { ProduccionModule } from '../produccion/produccion.module';
import { SalidasModule } from '../salidas/salidas.module';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';

@Module({
  imports: [InventarioModule, MermasModule, ProduccionModule, SalidasModule],
  controllers: [PanelController],
  providers: [PanelService],
})
export class PanelModule {}
