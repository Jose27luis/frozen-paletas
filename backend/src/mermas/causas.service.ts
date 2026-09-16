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
  _count: { select: { mermas: true } },
} satisfies Prisma.CausaMermaSelect;

type CausaSeleccionada = Prisma.CausaMermaGetPayload<{
  select: typeof SELECCION_CAUSA;
}>;

function aDto(causa: CausaSeleccionada): CausaMermaDto {
  return {
    id: causa.id,
    nombre: causa.nombre,
    requiereDescripcion: causa.requiereDescripcion,
    activa: causa.activa,
    usos: causa._count.mermas,
  };
}

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

    const creada = await this.prisma.causaMerma.create({
      data: {
        nombre: datos.nombre,
        requiereDescripcion: datos.requiereDescripcion ?? false,
      },
      select: SELECCION_CAUSA,
    });

    return aDto(creada);
  }

  async listar(): Promise<CausaMermaDto[]> {
    const causas = await this.prisma.causaMerma.findMany({
      orderBy: [{ activa: 'desc' }, { nombre: 'asc' }],
      select: SELECCION_CAUSA,
    });

    return causas.map(aDto);
  }

  async cambiarEstado(id: string, activa: boolean): Promise<CausaMermaDto> {
    await this.exigirCausa(id);

    const actualizada = await this.prisma.causaMerma.update({
      where: { id },
      data: { activa },
      select: SELECCION_CAUSA,
    });

    return aDto(actualizada);
  }

  async eliminar(id: string): Promise<void> {
    const causa = await this.exigirCausa(id);

    if (causa.usos > 0) {
      throw new ConflictException(
        `${causa.nombre} tiene ${causa.usos} mermas registradas: desactívala en vez de borrarla, o el histórico perdería el motivo`,
      );
    }

    await this.prisma.causaMerma.delete({ where: { id } });
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

    return aDto(causa);
  }
}
