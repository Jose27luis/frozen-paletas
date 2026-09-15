import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { cifrarPassword } from '../common/cripto/password';
import { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuarioDto } from './dto/usuario.dto';

const SELECCION_USUARIO = {
  id: true,
  nombres: true,
  apellidos: true,
  correo: true,
  rol: true,
  activo: true,
  creadoEn: true,
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(datos: CrearUsuarioDto): Promise<UsuarioDto> {
    await this.exigirCorreoLibre(datos.correo);

    return this.prisma.usuario.create({
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        correo: datos.correo,
        rol: datos.rol,
        passwordHash: await cifrarPassword(datos.password),
      },
      select: SELECCION_USUARIO,
    });
  }

  listar(): Promise<UsuarioDto[]> {
    return this.prisma.usuario.findMany({
      orderBy: [{ activo: 'desc' }, { nombres: 'asc' }],
      select: SELECCION_USUARIO,
    });
  }

  async obtener(id: string): Promise<UsuarioDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: SELECCION_USUARIO,
    });

    if (usuario === null) {
      throw new NotFoundException('El usuario no existe');
    }

    return usuario;
  }

  async actualizar(
    id: string,
    datos: ActualizarUsuarioDto,
  ): Promise<UsuarioDto> {
    const usuario = await this.obtener(id);

    if (datos.correo !== undefined && datos.correo !== usuario.correo) {
      await this.exigirCorreoLibre(datos.correo);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        correo: datos.correo,
        rol: datos.rol,
        passwordHash:
          datos.password === undefined
            ? undefined
            : await cifrarPassword(datos.password),
      },
      select: SELECCION_USUARIO,
    });
  }

  async desactivar(actor: UsuarioAutenticado, id: string): Promise<UsuarioDto> {
    if (actor.id === id) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    await this.obtener(id);

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: SELECCION_USUARIO,
    });
  }

  async reactivar(id: string): Promise<UsuarioDto> {
    await this.obtener(id);

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: true },
      select: SELECCION_USUARIO,
    });
  }

  private async exigirCorreoLibre(correo: string): Promise<void> {
    const existente = await this.prisma.usuario.findUnique({
      where: { correo },
      select: { id: true },
    });

    if (existente !== null) {
      throw new ConflictException('Ya hay un usuario con ese correo');
    }
  }
}
