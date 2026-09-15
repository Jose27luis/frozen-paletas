import { Module } from '@nestjs/common';
import { InventarioModule } from '../inventario/inventario.module';
import { SaboresModule } from '../sabores/sabores.module';
import { CausasService } from './causas.service';
import { MermasController } from './mermas.controller';
import { MermasService } from './mermas.service';

@Module({
  imports: [InventarioModule, SaboresModule],
  controllers: [MermasController],
  providers: [MermasService, CausasService],
  exports: [MermasService, CausasService],
})
export class MermasModule {}
