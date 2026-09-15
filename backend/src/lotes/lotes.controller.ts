import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { PERMISOS } from '../permisos/claves';
import { ListarLotesDto } from './dto/listar-lotes.dto';
import { LoteDto } from './dto/lote.dto';
import { LotesService } from './lotes.service';

@ApiTags('Lotes')
@ApiBearerAuth()
@RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar los lotes producidos y lo que queda de cada uno',
  })
  @ApiOkResponse({ type: [LoteDto] })
  listar(@Query() filtros: ListarLotesDto): Promise<LoteDto[]> {
    return this.lotesService.listar(filtros);
  }

  @Get('codigo/:codigo')
  @ApiOperation({ summary: 'Buscar un lote por su código impreso' })
  @ApiOkResponse({ type: LoteDto })
  @ApiNotFoundResponse({ description: 'No hay ningún lote con ese código' })
  porCodigo(@Param('codigo') codigo: string): Promise<LoteDto> {
    return this.lotesService.porCodigo(codigo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un lote concreto' })
  @ApiOkResponse({ type: LoteDto })
  @ApiNotFoundResponse({ description: 'El lote no existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string): Promise<LoteDto> {
    return this.lotesService.obtener(id);
  }
}
