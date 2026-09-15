import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { PERMISOS } from '../permisos/claves';
import { ListarMovimientosDto } from './dto/listar-movimientos.dto';
import { MovimientoDto } from './dto/movimiento.dto';
import { InventarioDto, StockSaborDto } from './dto/stock-sabor.dto';
import { InventarioService } from './inventario.service';

@ApiTags('Inventario')
@ApiBearerAuth()
@RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar el stock total y el stock disponible de cada sabor',
  })
  @ApiOkResponse({ type: InventarioDto })
  resumen(): Promise<InventarioDto> {
    return this.inventarioService.resumen();
  }

  @Get('reponer')
  @ApiOperation({
    summary:
      'Listar los sabores activos que llegaron al stock mínimo o se agotaron',
  })
  @ApiOkResponse({ type: [StockSaborDto] })
  aReponer(): Promise<StockSaborDto[]> {
    return this.inventarioService.aReponer();
  }

  @Get('movimientos')
  @ApiOperation({
    summary: 'Consultar el historial de movimientos que forman el stock',
  })
  @ApiOkResponse({ type: [MovimientoDto] })
  movimientos(
    @Query() filtros: ListarMovimientosDto,
  ): Promise<MovimientoDto[]> {
    return this.inventarioService.movimientos(filtros);
  }
}
