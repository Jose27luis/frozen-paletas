import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { EstadoSabor } from '../generated/prisma/enums';
import { PERMISOS } from '../permisos/claves';
import { ActualizarSaborDto } from './dto/actualizar-sabor.dto';
import { CrearSaborDto } from './dto/crear-sabor.dto';
import { ListarSaboresDto } from './dto/listar-sabores.dto';
import { SaborDto } from './dto/sabor.dto';
import { SaboresService } from './sabores.service';

@ApiTags('Sabores')
@ApiBearerAuth()
@Controller('sabores')
export class SaboresController {
  constructor(private readonly saboresService: SaboresService) {}

  @Post()
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @ApiOperation({ summary: 'Registrar un sabor en el catálogo' })
  @ApiCreatedResponse({ type: SaborDto })
  @ApiConflictResponse({ description: 'El nombre o la abreviatura ya existen' })
  crear(@Body() datos: CrearSaborDto): Promise<SaborDto> {
    return this.saboresService.crear(datos);
  }

  @Get()
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Listar el catálogo de sabores' })
  @ApiOkResponse({ type: [SaborDto] })
  listar(@Query() filtros: ListarSaboresDto): Promise<SaborDto[]> {
    return this.saboresService.listar(filtros);
  }

  @Get(':id')
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Consultar un sabor concreto' })
  @ApiOkResponse({ type: SaborDto })
  @ApiNotFoundResponse({ description: 'El sabor no existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string): Promise<SaborDto> {
    return this.saboresService.obtener(id);
  }

  @Patch(':id')
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @ApiOperation({ summary: 'Actualizar los datos de un sabor' })
  @ApiOkResponse({ type: SaborDto })
  @ApiNotFoundResponse({ description: 'El sabor no existe' })
  @ApiConflictResponse({ description: 'El nombre o la abreviatura ya existen' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: ActualizarSaborDto,
  ): Promise<SaborDto> {
    return this.saboresService.actualizar(id, datos);
  }

  @Delete(':id')
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @ApiOperation({
    summary: 'Desactivar un sabor conservando sus lotes y su histórico',
  })
  @ApiOkResponse({ type: SaborDto })
  @ApiNotFoundResponse({ description: 'El sabor no existe' })
  desactivar(@Param('id', ParseUUIDPipe) id: string): Promise<SaborDto> {
    return this.saboresService.cambiarEstado(id, EstadoSabor.INACTIVO);
  }

  @Post(':id/activar')
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @ApiOperation({
    summary: 'Poner un sabor en producción, contando para las alertas de stock',
  })
  @ApiOkResponse({ type: SaborDto })
  @ApiNotFoundResponse({ description: 'El sabor no existe' })
  activar(@Param('id', ParseUUIDPipe) id: string): Promise<SaborDto> {
    return this.saboresService.cambiarEstado(id, EstadoSabor.ACTIVO);
  }
}
