import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { Rol } from '../generated/prisma/enums';
import { PERMISOS } from './claves';
import { ActualizarPermisosRolDto } from './dto/actualizar-permisos-rol.dto';
import { PermisoDto } from './dto/permiso.dto';
import { PermisosService } from './permisos.service';

@ApiTags('Permisos')
@ApiBearerAuth()
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar el catálogo de permisos y qué rol tiene concedido cada uno',
  })
  @ApiOkResponse({ type: [PermisoDto] })
  listar(): Promise<PermisoDto[]> {
    return this.permisosService.listar();
  }

  @Put(':rol')
  @RequierePermiso(PERMISOS.ADMINISTRAR_USUARIOS)
  @ApiOperation({
    summary: 'Reemplazar los permisos concedidos a un rol sin redesplegar',
  })
  @ApiParam({ name: 'rol', enum: Rol, enumName: 'Rol' })
  @ApiOkResponse({ type: [PermisoDto] })
  @ApiBadRequestResponse({
    description: 'El rol de administrador no se edita',
  })
  actualizar(
    @Param('rol', new ParseEnumPipe(Rol)) rol: Rol,
    @Body() datos: ActualizarPermisosRolDto,
  ): Promise<PermisoDto[]> {
    return this.permisosService.actualizarRol(rol, datos.claves);
  }
}
