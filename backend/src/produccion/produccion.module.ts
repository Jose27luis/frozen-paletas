import { Module } from '@nestjs/common';
import { InventarioModule } from '../inventario/inventario.module';
import { LotesModule } from '../lotes/lotes.module';
import { MermasModule } from '../mermas/mermas.module';
import { SaboresModule } from '../sabores/sabores.module';
import { ProduccionController } from './produccion.controller';
import { ProduccionService } from './produccion.service';

@Module({
  imports: [InventarioModule, LotesModule, MermasModule, SaboresModule],
  controllers: [ProduccionController],
  providers: [ProduccionService],
  exports: [ProduccionService],
})
export class ProduccionModule {}
