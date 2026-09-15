import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { UsuarioActual } from '../common/decoradores/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { PERMISOS } from '../permisos/claves';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuarioDto } from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@RequierePermiso(PERMISOS.ADMINISTRAR_USUARIOS)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Dar de alta un usuario' })
  @ApiCreatedResponse({ type: UsuarioDto })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  crear(@Body() datos: CrearUsuarioDto): Promise<UsuarioDto> {
    return this.usuariosService.crear(datos);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los usuarios del sistema' })
  @ApiOkResponse({ type: [UsuarioDto] })
  listar(): Promise<UsuarioDto[]> {
    return this.usuariosService.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un usuario concreto' })
  @ApiOkResponse({ type: UsuarioDto })
  @ApiNotFoundResponse({ description: 'El usuario no existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string): Promise<UsuarioDto> {
    return this.usuariosService.obtener(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos, el rol o la contraseña' })
  @ApiOkResponse({ type: UsuarioDto })
  @ApiNotFoundResponse({ description: 'El usuario no existe' })
  @ApiConflictResponse({ description: 'El correo ya está registrado' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: ActualizarUsuarioDto,
  ): Promise<UsuarioDto> {
    return this.usuariosService.actualizar(id, datos);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un usuario conservando su histórico de registros',
  })
  @ApiOkResponse({ type: UsuarioDto })
  @ApiBadRequestResponse({ description: 'No puedes desactivarte a ti mismo' })
  @ApiNotFoundResponse({ description: 'El usuario no existe' })
  desactivar(
    @UsuarioActual() actor: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UsuarioDto> {
    return this.usuariosService.desactivar(actor, id);
  }

  @Post(':id/reactivar')
  @ApiOperation({ summary: 'Volver a habilitar el acceso de un usuario' })
  @ApiOkResponse({ type: UsuarioDto })
  @ApiNotFoundResponse({ description: 'El usuario no existe' })
  reactivar(@Param('id', ParseUUIDPipe) id: string): Promise<UsuarioDto> {
    return this.usuariosService.reactivar(id);
  }
}
