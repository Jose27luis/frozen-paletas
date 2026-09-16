import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { PERMISOS } from '../permisos/claves';
import { IndicadoresDto } from './dto/indicadores.dto';
import { PanelDto } from './dto/panel.dto';
import { RangoIndicadoresDto } from './dto/rango-indicadores.dto';
import { IndicadoresService } from './indicadores.service';
import { PanelService } from './panel.service';

@ApiTags('Panel')
@ApiBearerAuth()
@RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
@Controller('panel')
export class PanelController {
  constructor(
    private readonly panelService: PanelService,
    private readonly indicadoresService: IndicadoresService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Devolver el estado de Frozen en una sola consulta: stock, reposición y últimos movimientos',
  })
  @ApiOkResponse({ type: PanelDto })
  resumen(): Promise<PanelDto> {
    return this.panelService.resumen();
  }

  @Get('indicadores')
  @ApiOperation({
    summary:
      'Calcular producción, salidas por canal, merma y rotación de un rango de fechas',
  })
  @ApiOkResponse({ type: IndicadoresDto })
  indicadores(@Query() rango: RangoIndicadoresDto): Promise<IndicadoresDto> {
    return this.indicadoresService.calcular(rango);
  }
}
