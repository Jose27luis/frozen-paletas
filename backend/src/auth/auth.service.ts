import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import {
  CargaJwt,
  UsuarioAutenticado,
} from '../common/tipos/usuario-autenticado';
import { Rol } from '../generated/prisma/enums';
import { PermisosService } from '../permisos/permisos.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SesionDto, UsuarioSesionDto } from './dto/sesion.dto';

const DURACION_MAXIMA_DE_SESION_EN_SEGUNDOS = 30 * 24 * 60 * 60;

interface CargaSesion extends CargaJwt {
  inicio?: number;
  iat?: number;
}

interface DatosUsuario {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: Rol;
}

function ahoraEnSegundos(): number {
  return Math.floor(Date.now() / 1000);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly permisosService: PermisosService,
  ) {}

  async login(datos: LoginDto): Promise<SesionDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: datos.correo },
    });

    if (usuario === null || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await compare(datos.password, usuario.passwordHash);

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.sesionDe(usuario, ahoraEnSegundos());
  }

  async renovar(token: string): Promise<SesionDto> {
    const carga = await this.leer(token);
    const inicio = carga.inicio ?? carga.iat ?? 0;

    if (ahoraEnSegundos() - inicio > DURACION_MAXIMA_DE_SESION_EN_SEGUNDOS) {
      throw new UnauthorizedException(
        'Tu sesión cumplió 30 días: vuelve a iniciar sesión',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: carga.sub },
    });

    if (usuario === null || !usuario.activo) {
      throw new UnauthorizedException('La sesión ya no es válida');
    }

    return this.sesionDe(usuario, inicio);
  }

  async perfil(actor: UsuarioAutenticado): Promise<UsuarioSesionDto> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: actor.id },
    });

    return this.aUsuarioSesion(usuario);
  }

  private async leer(token: string): Promise<CargaSesion> {
    try {
      return await this.jwtService.verifyAsync<CargaSesion>(token);
    } catch {
      throw new UnauthorizedException('La sesión ya no es válida');
    }
  }

  private async sesionDe(
    usuario: DatosUsuario,
    inicio: number,
  ): Promise<SesionDto> {
    const carga: CargaSesion = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      inicio,
    };

    return {
      accessToken: await this.jwtService.signAsync(carga),
      usuario: await this.aUsuarioSesion(usuario),
    };
  }

  private async aUsuarioSesion(
    usuario: DatosUsuario,
  ): Promise<UsuarioSesionDto> {
    const permisos = await this.permisosService.clavesDelRol(usuario.rol);

    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      rol: usuario.rol,
      permisos: [...permisos],
    };
  }
}
