import { Module } from '@nestjs/common';
import { DestinosModule } from '../destinos/destinos.module';
import { InventarioModule } from '../inventario/inventario.module';
import { SaboresModule } from '../sabores/sabores.module';
import { SalidasController } from './salidas.controller';
import { SalidasService } from './salidas.service';

@Module({
  imports: [DestinosModule, InventarioModule, SaboresModule],
  controllers: [SalidasController],
  providers: [SalidasService],
  exports: [SalidasService],
})
export class SalidasModule {}
