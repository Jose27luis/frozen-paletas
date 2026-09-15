import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { EstadoSabor } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarSaborDto } from './dto/actualizar-sabor.dto';
import { CrearSaborDto } from './dto/crear-sabor.dto';
import { ListarSaboresDto } from './dto/listar-sabores.dto';
import { SaborDto } from './dto/sabor.dto';

const SELECCION_SABOR = {
  id: true,
  nombre: true,
  abreviatura: true,
  categoria: true,
  estado: true,
  stockMinimo: true,
  creadoEn: true,
} satisfies Prisma.SaborSelect;

@Injectable()
export class SaboresService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: CrearSaborDto): Promise<SaborDto> {
    await this.exigirNombreLibre(datos.nombre);
    await this.exigirAbreviaturaLibre(datos.abreviatura);

    return this.prisma.sabor.create({
      data: {
        nombre: datos.nombre,
        abreviatura: datos.abreviatura,
        categoria: datos.categoria,
        estado: datos.estado ?? EstadoSabor.ACTIVO,
        stockMinimo: datos.stockMinimo,
      },
      select: SELECCION_SABOR,
    });
  }

  listar(filtros: ListarSaboresDto): Promise<SaborDto[]> {
    return this.prisma.sabor.findMany({
      where: { estado: filtros.estado, categoria: filtros.categoria },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
      select: SELECCION_SABOR,
    });
  }

  async obtener(id: string): Promise<SaborDto> {
    const sabor = await this.prisma.sabor.findUnique({
      where: { id },
      select: SELECCION_SABOR,
    });

    if (sabor === null) {
      throw new NotFoundException('El sabor no existe');
    }

    return sabor;
  }

  async actualizar(id: string, datos: ActualizarSaborDto): Promise<SaborDto> {
    const sabor = await this.obtener(id);

    if (datos.nombre !== undefined && datos.nombre !== sabor.nombre) {
      await this.exigirNombreLibre(datos.nombre);
    }

    if (
      datos.abreviatura !== undefined &&
      datos.abreviatura !== sabor.abreviatura
    ) {
      await this.exigirAbreviaturaLibre(datos.abreviatura);
    }

    return this.prisma.sabor.update({
      where: { id },
      data: {
        nombre: datos.nombre,
        abreviatura: datos.abreviatura,
        categoria: datos.categoria,
        estado: datos.estado,
        stockMinimo: datos.stockMinimo,
      },
      select: SELECCION_SABOR,
    });
  }

  async cambiarEstado(id: string, estado: EstadoSabor): Promise<SaborDto> {
    await this.obtener(id);

    return this.prisma.sabor.update({
      where: { id },
      data: { estado },
      select: SELECCION_SABOR,
    });
  }

  async exigirSaborActivo(id: string): Promise<SaborDto> {
    const sabor = await this.obtener(id);

    if (sabor.estado === EstadoSabor.INACTIVO) {
      throw new ConflictException(
        `El sabor ${sabor.nombre} está desactivado y no admite movimientos`,
      );
    }

    return sabor;
  }

  private async exigirNombreLibre(nombre: string): Promise<void> {
    const existente = await this.prisma.sabor.findUnique({
      where: { nombre },
      select: { id: true },
    });

    if (existente !== null) {
      throw new ConflictException('Ya hay un sabor con ese nombre');
    }
  }

  private async exigirAbreviaturaLibre(abreviatura: string): Promise<void> {
    const existente = await this.prisma.sabor.findUnique({
      where: { abreviatura },
      select: { id: true },
    });

    if (existente !== null) {
      throw new ConflictException('Ya hay un sabor con esa abreviatura');
    }
  }
}
