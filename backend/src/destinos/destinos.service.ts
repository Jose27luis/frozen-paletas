import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { TipoSalida } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarDestinoDto } from './dto/actualizar-destino.dto';
import { CrearDestinoDto } from './dto/crear-destino.dto';
import { DestinoDto } from './dto/destino.dto';
import { ListarDestinosDto } from './dto/listar-destinos.dto';

const SELECCION_DESTINO = {
  id: true,
  tipo: true,
  nombre: true,
  direccion: true,
  telefono: true,
  activo: true,
  creadoEn: true,
} satisfies Prisma.DestinoSelect;

@Injectable()
export class DestinosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: CrearDestinoDto): Promise<DestinoDto> {
    const existente = await this.prisma.destino.findUnique({
      where: { tipo_nombre: { tipo: datos.tipo, nombre: datos.nombre } },
      select: { id: true },
    });

    if (existente !== null) {
      throw new ConflictException('Ya hay un destino con ese nombre y tipo');
    }

    return this.prisma.destino.create({
      data: datos,
      select: SELECCION_DESTINO,
    });
  }

  listar(filtros: ListarDestinosDto): Promise<DestinoDto[]> {
    return this.prisma.destino.findMany({
      where: { tipo: filtros.tipo, activo: filtros.activo },
      orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }],
      select: SELECCION_DESTINO,
    });
  }

  async obtener(id: string): Promise<DestinoDto> {
    const destino = await this.prisma.destino.findUnique({
      where: { id },
      select: SELECCION_DESTINO,
    });

    if (destino === null) {
      throw new NotFoundException('El destino no existe');
    }

    return destino;
  }

  async actualizar(
    id: string,
    datos: ActualizarDestinoDto,
  ): Promise<DestinoDto> {
    await this.obtener(id);

    return this.prisma.destino.update({
      where: { id },
      data: datos,
      select: SELECCION_DESTINO,
    });
  }

  async cambiarEstado(id: string, activo: boolean): Promise<DestinoDto> {
    await this.obtener(id);

    return this.prisma.destino.update({
      where: { id },
      data: { activo },
      select: SELECCION_DESTINO,
    });
  }

  async exigirDestinoDelTipo(
    id: string,
    tipo: TipoSalida,
  ): Promise<DestinoDto> {
    const destino = await this.obtener(id);

    if (destino.tipo !== tipo) {
      throw new ConflictException(
        `El destino ${destino.nombre} no corresponde a una salida de tipo ${tipo}`,
      );
    }

    if (!destino.activo) {
      throw new ConflictException(`El destino ${destino.nombre} está inactivo`);
    }

    return destino;
  }
}
