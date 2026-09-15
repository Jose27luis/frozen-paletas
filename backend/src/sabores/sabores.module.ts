import { Module } from '@nestjs/common';
import { SaboresController } from './sabores.controller';
import { SaboresService } from './sabores.service';

@Module({
  controllers: [SaboresController],
  providers: [SaboresService],
  exports: [SaboresService],
})
export class SaboresModule {}
