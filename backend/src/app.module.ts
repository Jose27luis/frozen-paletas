import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermisosGuard } from './common/guards/permisos.guard';
import { validarEntorno } from './config/env.validation';
import { DestinosModule } from './destinos/destinos.module';
import { HealthModule } from './health/health.module';
import { InventarioModule } from './inventario/inventario.module';
import { LotesModule } from './lotes/lotes.module';
import { MermasModule } from './mermas/mermas.module';
import { PanelModule } from './panel/panel.module';
import { PermisosModule } from './permisos/permisos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProduccionModule } from './produccion/produccion.module';
import { SaboresModule } from './sabores/sabores.module';
import { SalidasModule } from './salidas/salidas.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEntorno }),
    PrismaModule,
    PermisosModule,
    AuthModule,
    HealthModule,
    UsuariosModule,
    SaboresModule,
    InventarioModule,
    LotesModule,
    ProduccionModule,
    DestinosModule,
    SalidasModule,
    MermasModule,
    PanelModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermisosGuard },
  ],
})
export class AppModule {}
