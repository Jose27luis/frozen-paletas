import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configurarApp, documentarApp } from './app.setup';

async function iniciar(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configurarApp(app);
  documentarApp(app);

  await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'));
}

void iniciar();
