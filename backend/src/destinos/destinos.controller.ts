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
import { PERMISOS } from '../permisos/claves';
import { DestinosService } from './destinos.service';
import { ActualizarDestinoDto } from './dto/actualizar-destino.dto';
import { CrearDestinoDto } from './dto/crear-destino.dto';
import { DestinoDto } from './dto/destino.dto';
import { ListarDestinosDto } from './dto/listar-destinos.dto';

@ApiTags('Destinos')
@ApiBearerAuth()
@Controller('destinos')
export class DestinosController {
  constructor(private readonly destinosService: DestinosService) {}

  @Post()
  @RequierePermiso(PERMISOS.ADMINISTRAR_DESTINOS)
  @ApiOperation({
    summary: 'Registrar un punto de venta, cliente mayorista, feria o cliente',
  })
  @ApiCreatedResponse({ type: DestinoDto })
  @ApiConflictResponse({
    description: 'Ya hay un destino con ese nombre y tipo',
  })
  crear(@Body() datos: CrearDestinoDto): Promise<DestinoDto> {
    return this.destinosService.crear(datos);
  }

  @Get()
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Listar los destinos a los que sale el producto' })
  @ApiOkResponse({ type: [DestinoDto] })
  listar(@Query() filtros: ListarDestinosDto): Promise<DestinoDto[]> {
    return this.destinosService.listar(filtros);
  }

  @Get(':id')
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Consultar un destino concreto' })
  @ApiOkResponse({ type: DestinoDto })
  @ApiNotFoundResponse({ description: 'El destino no existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string): Promise<DestinoDto> {
    return this.destinosService.obtener(id);
  }

  @Patch(':id')
  @RequierePermiso(PERMISOS.ADMINISTRAR_DESTINOS)
  @ApiOperation({ summary: 'Actualizar los datos de contacto de un destino' })
  @ApiOkResponse({ type: DestinoDto })
  @ApiNotFoundResponse({ description: 'El destino no existe' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() datos: ActualizarDestinoDto,
  ): Promise<DestinoDto> {
    return this.destinosService.actualizar(id, datos);
  }

  @Delete(':id')
  @RequierePermiso(PERMISOS.ADMINISTRAR_DESTINOS)
  @ApiOperation({
    summary: 'Dar de baja un destino conservando sus salidas anteriores',
  })
  @ApiOkResponse({ type: DestinoDto })
  desactivar(@Param('id', ParseUUIDPipe) id: string): Promise<DestinoDto> {
    return this.destinosService.cambiarEstado(id, false);
  }

  @Post(':id/activar')
  @RequierePermiso(PERMISOS.ADMINISTRAR_DESTINOS)
  @ApiOperation({ summary: 'Volver a poner en servicio un destino' })
  @ApiOkResponse({ type: DestinoDto })
  activar(@Param('id', ParseUUIDPipe) id: string): Promise<DestinoDto> {
    return this.destinosService.cambiarEstado(id, true);
  }
}
