import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { AnularProduccionDto } from './dto/anular-produccion.dto';
import { ListarProduccionesDto } from './dto/listar-producciones.dto';
import { ProduccionDto } from './dto/produccion.dto';
import { RegistrarEmbolsadoDto } from './dto/registrar-embolsado.dto';
import { RegistrarProduccionDto } from './dto/registrar-produccion.dto';
import { ProduccionService } from './produccion.service';

@ApiTags('Producción')
@ApiBearerAuth()
@Controller('produccion')
export class ProduccionController {
  constructor(private readonly produccionService: ProduccionService) {}

  @Post()
  @RequierePermiso(PERMISOS.REGISTRAR_PRODUCCION)
  @ApiOperation({
    summary:
      'Registrar lo obtenido al terminar la producción y generar su lote; todavía no mueve el stock',
  })
  @ApiCreatedResponse({ type: ProduccionDto })
  @ApiConflictResponse({ description: 'El sabor está desactivado' })
  registrar(
    @UsuarioActual() actor: UsuarioAutenticado,
    @Body() datos: RegistrarProduccionDto,
  ): Promise<ProduccionDto> {
    return this.produccionService.registrar(actor, datos);
  }

  @Get()
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Listar las producciones registradas' })
  @ApiOkResponse({ type: [ProduccionDto] })
  listar(@Query() filtros: ListarProduccionesDto): Promise<ProduccionDto[]> {
    return this.produccionService.listar(filtros);
  }

  @Get('pendientes')
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({
    summary: 'Listar las producciones que esperan su conteo de embolsado',
  })
  @ApiOkResponse({ type: [ProduccionDto] })
  pendientes(): Promise<ProduccionDto[]> {
    return this.produccionService.pendientesDeEmbolsar();
  }

  @Get(':id')
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Consultar una producción concreta' })
  @ApiOkResponse({ type: ProduccionDto })
  @ApiNotFoundResponse({ description: 'La producción no existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string): Promise<ProduccionDto> {
    return this.produccionService.obtener(id);
  }

  @Post(':id/embolsado')
  @RequierePermiso(PERMISOS.REGISTRAR_PRODUCCION)
  @ApiOperation({
    summary:
      'Registrar el conteo final tras el embolsado: es el momento en que las paletas entran al stock',
  })
  @ApiOkResponse({ type: ProduccionDto })
  @ApiBadRequestResponse({
    description: 'Se embolsó más de lo producido o falta la causa de la merma',
  })
  @ApiConflictResponse({
    description: 'La producción ya ingresó o está anulada',
  })
  embolsar(
    @UsuarioActual() actor: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: RegistrarEmbolsadoDto,
  ): Promise<ProduccionDto> {
    return this.produccionService.embolsar(actor, id, datos);
  }

  @Post(':id/anular')
  @RequierePermiso(PERMISOS.REGISTRAR_PRODUCCION)
  @ApiOperation({
    summary: 'Anular una producción que todavía no ingresó al stock',
  })
  @ApiOkResponse({ type: ProduccionDto })
  @ApiConflictResponse({
    description: 'La producción ya ingresó al stock o ya estaba anulada',
  })
  anular(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: AnularProduccionDto,
  ): Promise<ProduccionDto> {
    return this.produccionService.anular(id, datos);
  }
}
