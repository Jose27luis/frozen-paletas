import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoBaseDatos, HealthDto } from './dto/health.dto';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async comprobar(): Promise<HealthDto> {
    const baseDatos = await this.consultarBaseDatos();

    return {
      estado: baseDatos === EstadoBaseDatos.DISPONIBLE ? 'ok' : 'degradado',
      baseDatos,
      instante: new Date().toISOString(),
    };
  }

  private async consultarBaseDatos(): Promise<EstadoBaseDatos> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return EstadoBaseDatos.DISPONIBLE;
    } catch {
      return EstadoBaseDatos.NO_DISPONIBLE;
    }
  }
}
