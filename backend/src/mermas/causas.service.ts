import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CausaMermaDto } from './dto/causa-merma.dto';
import { CrearCausaMermaDto } from './dto/crear-causa-merma.dto';

const SELECCION_CAUSA = {
  id: true,
  nombre: true,
  requiereDescripcion: true,
  activa: true,
} satisfies Prisma.CausaMermaSelect;

@Injectable()
export class CausasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: CrearCausaMermaDto): Promise<CausaMermaDto> {
    const existente = await this.prisma.causaMerma.findUnique({
      where: { nombre: datos.nombre },
      select: { id: true },
    });

    if (existente !== null) {
      throw new ConflictException('Ya hay una causa con ese nombre');
    }

    return this.prisma.causaMerma.create({
      data: {
        nombre: datos.nombre,
        requiereDescripcion: datos.requiereDescripcion ?? false,
      },
      select: SELECCION_CAUSA,
    });
  }

  listar(): Promise<CausaMermaDto[]> {
    return this.prisma.causaMerma.findMany({
      orderBy: [{ activa: 'desc' }, { nombre: 'asc' }],
      select: SELECCION_CAUSA,
    });
  }

  async cambiarEstado(id: string, activa: boolean): Promise<CausaMermaDto> {
    await this.exigirCausa(id);

    return this.prisma.causaMerma.update({
      where: { id },
      data: { activa },
      select: SELECCION_CAUSA,
    });
  }

  async exigirCausaUsable(
    id: string,
    observacion: string | undefined,
  ): Promise<CausaMermaDto> {
    const causa = await this.exigirCausa(id);

    if (!causa.activa) {
      throw new ConflictException(`La causa ${causa.nombre} está desactivada`);
    }

    if (
      causa.requiereDescripcion &&
      (observacion === undefined || observacion.trim() === '')
    ) {
      throw new BadRequestException(
        `La causa ${causa.nombre} exige describir lo que pasó`,
      );
    }

    return causa;
  }

  private async exigirCausa(id: string): Promise<CausaMermaDto> {
    const causa = await this.prisma.causaMerma.findUnique({
      where: { id },
      select: SELECCION_CAUSA,
    });

    if (causa === null) {
      throw new NotFoundException('La causa de merma no existe');
    }

    return causa;
  }
}
