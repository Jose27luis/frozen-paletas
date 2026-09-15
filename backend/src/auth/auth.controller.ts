import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Publico } from '../common/decoradores/publico.decorator';
import { UsuarioActual } from '../common/decoradores/usuario-actual.decorator';
import { AntifuerzaBrutaGuard } from '../common/guards/antifuerza-bruta.guard';
import type { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SesionDto, UsuarioSesionDto } from './dto/sesion.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Publico()
  @UseGuards(AntifuerzaBrutaGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener el token de acceso' })
  @ApiOkResponse({ type: SesionDto })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario desactivado',
  })
  @ApiTooManyRequestsResponse({
    description: 'Demasiados intentos seguidos contra la misma cuenta',
  })
  login(@Body() datos: LoginDto): Promise<SesionDto> {
    return this.authService.login(datos);
  }

  @Post('renovar')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cambiar el token de una sesión en uso por uno nuevo; una sesión no pasa de 30 días desde que se inició',
  })
  @ApiOkResponse({ type: SesionDto })
  @ApiUnauthorizedResponse({
    description:
      'Token vencido, usuario desactivado o sesión iniciada hace más de 30 días',
  })
  renovar(
    @Headers('authorization') cabecera: string | undefined,
  ): Promise<SesionDto> {
    return this.authService.renovar(cabecera?.replace(/^Bearer /, '') ?? '');
  }

  @Get('perfil')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Devolver el perfil y los permisos de la sesión actual',
  })
  @ApiOkResponse({ type: UsuarioSesionDto })
  perfil(
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<UsuarioSesionDto> {
    return this.authService.perfil(usuario);
  }
}
