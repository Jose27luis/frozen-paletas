import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { ExcepcionesFilter } from './common/filtros/excepciones.filter';
import { aErroresEnEspanol } from './common/i18n/mensajes-validacion';
import { origenesPermitidos } from './config/origenes';

const RUTA_DOCUMENTACION = '/api/docs';

function casco(): (
  peticion: Request,
  respuesta: Response,
  siguiente: NextFunction,
) => void {
  const general = helmet();
  const documentacion = helmet({ contentSecurityPolicy: false });

  return (peticion, respuesta, siguiente) => {
    if (peticion.path.startsWith(RUTA_DOCUMENTACION)) {
      documentacion(peticion, respuesta, siguiente);
      return;
    }

    general(peticion, respuesta, siguiente);
  };
}

export function configurarApp(app: NestExpressApplication): void {
  app.setGlobalPrefix('api');
  app.set('trust proxy', 'loopback');
  app.use(casco());
  app.enableCors({ origin: origenesPermitidos(app.get(ConfigService)) });
  app.useGlobalFilters(new ExcepcionesFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errores) => {
        const { mensajes, campos } = aErroresEnEspanol(errores);

        return new BadRequestException({ message: mensajes, campos });
      },
    }),
  );
}

export function documentarApp(app: INestApplication): void {
  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Frozen Paletas Artesanales')
      .setDescription(
        'API de control de inventario de paletas: producción, embolsado, stock, salidas y mermas',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );

  SwaggerModule.setup('api/docs', app, documento);
}
