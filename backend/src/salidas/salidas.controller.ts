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
import { ListarSalidasDto } from './dto/listar-salidas.dto';
import { RegistrarSalidaDto } from './dto/registrar-salida.dto';
import { SalidaDto } from './dto/salida.dto';
import { SalidasService } from './salidas.service';

@ApiTags('Salidas')
@ApiBearerAuth()
@Controller('salidas')
export class SalidasController {
  constructor(private readonly salidasService: SalidasService) {}

  @Post()
  @RequierePermiso(PERMISOS.REGISTRAR_SALIDAS)
  @ApiOperation({
    summary:
      'Registrar una salida y descontarla del inventario; sin lote indicado descuenta el más antiguo (PEPS)',
  })
  @ApiCreatedResponse({ type: SalidaDto })
  @ApiBadRequestResponse({
    description:
      'Falta el destino o el motivo, o no se llega al mínimo de delivery',
  })
  @ApiConflictResponse({ description: 'No hay stock suficiente del sabor' })
  registrar(
    @UsuarioActual() actor: UsuarioAutenticado,
    @Body() datos: RegistrarSalidaDto,
  ): Promise<SalidaDto> {
    return this.salidasService.registrar(actor, datos);
  }

  @Get()
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Listar las salidas registradas' })
  @ApiOkResponse({ type: [SalidaDto] })
  listar(@Query() filtros: ListarSalidasDto): Promise<SalidaDto[]> {
    return this.salidasService.listar(filtros);
  }

  @Get(':id')
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Consultar una salida con su detalle por lote' })
  @ApiOkResponse({ type: SalidaDto })
  @ApiNotFoundResponse({ description: 'La salida no existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string): Promise<SalidaDto> {
    return this.salidasService.obtener(id);
  }
}
