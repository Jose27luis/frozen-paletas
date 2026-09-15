import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { PERMISOS } from '../permisos/claves';
import { PanelDto } from './dto/panel.dto';
import { PanelService } from './panel.service';

@ApiTags('Panel')
@ApiBearerAuth()
@RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
@Controller('panel')
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @Get()
  @ApiOperation({
    summary:
      'Devolver el estado de Frozen en una sola consulta: stock, reposición y últimos movimientos',
  })
  @ApiOkResponse({ type: PanelDto })
  resumen(): Promise<PanelDto> {
    return this.panelService.resumen();
  }
}
