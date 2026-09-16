import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequierePermiso } from '../common/decoradores/permiso.decorator';
import { UsuarioActual } from '../common/decoradores/usuario-actual.decorator';
import type { UsuarioAutenticado } from '../common/tipos/usuario-autenticado';
import { PERMISOS } from '../permisos/claves';
import { CausasService } from './causas.service';
import { CausaMermaDto } from './dto/causa-merma.dto';
import { CrearCausaMermaDto } from './dto/crear-causa-merma.dto';
import { ListarMermasDto } from './dto/listar-mermas.dto';
import { MermaDto } from './dto/merma.dto';
import { RangoMermasDto } from './dto/rango-mermas.dto';
import { RegistrarMermaDto } from './dto/registrar-merma.dto';
import { ResumenMermasDto } from './dto/resumen-mermas.dto';
import { MermasService } from './mermas.service';

@ApiTags('Mermas')
@ApiBearerAuth()
@Controller('mermas')
export class MermasController {
  constructor(
    private readonly mermasService: MermasService,
    private readonly causasService: CausasService,
  ) {}

  @Post()
  @RequierePermiso(PERMISOS.REGISTRAR_MERMAS)
  @ApiOperation({
    summary: 'Registrar producto perdido y descontarlo del inventario',
  })
  @ApiCreatedResponse({ type: MermaDto })
  @ApiConflictResponse({ description: 'No hay stock suficiente del sabor' })
  registrar(
    @UsuarioActual() actor: UsuarioAutenticado,
    @Body() datos: RegistrarMermaDto,
  ): Promise<MermaDto> {
    return this.mermasService.registrar(actor, datos);
  }

  @Get()
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Listar las mermas registradas' })
  @ApiOkResponse({ type: [MermaDto] })
  listar(@Query() filtros: ListarMermasDto): Promise<MermaDto[]> {
    return this.mermasService.listar(filtros);
  }

  @Get('resumen')
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({
    summary: 'Resumir las mermas de un rango por causa, por sabor y por origen',
  })
  @ApiOkResponse({ type: ResumenMermasDto })
  resumen(@Query() rango: RangoMermasDto): Promise<ResumenMermasDto> {
    return this.mermasService.resumen(rango);
  }

  @Get('causas')
  @RequierePermiso(PERMISOS.CONSULTAR_INVENTARIO)
  @ApiOperation({ summary: 'Listar las causas de merma del catálogo' })
  @ApiOkResponse({ type: [CausaMermaDto] })
  listarCausas(): Promise<CausaMermaDto[]> {
    return this.causasService.listar();
  }

  @Post('causas')
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @ApiOperation({ summary: 'Añadir una causa de merma al catálogo' })
  @ApiCreatedResponse({ type: CausaMermaDto })
  @ApiConflictResponse({ description: 'Ya hay una causa con ese nombre' })
  crearCausa(@Body() datos: CrearCausaMermaDto): Promise<CausaMermaDto> {
    return this.causasService.crear(datos);
  }

  @Delete('causas/:id')
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una causa que todavía no se usó en ninguna merma',
  })
  @ApiNoContentResponse({ description: 'La causa quedó eliminada' })
  @ApiConflictResponse({
    description: 'La causa ya tiene mermas registradas: hay que desactivarla',
  })
  eliminarCausa(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.causasService.eliminar(id);
  }

  @Post('causas/:id/desactivar')
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @ApiOperation({
    summary: 'Dejar de ofrecer una causa sin tocar las mermas que ya la usan',
  })
  @ApiOkResponse({ type: CausaMermaDto })
  desactivarCausa(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CausaMermaDto> {
    return this.causasService.cambiarEstado(id, false);
  }

  @Post('causas/:id/activar')
  @RequierePermiso(PERMISOS.ADMINISTRAR_SABORES)
  @ApiOperation({ summary: 'Volver a ofrecer una causa desactivada' })
  @ApiOkResponse({ type: CausaMermaDto })
  activarCausa(@Param('id', ParseUUIDPipe) id: string): Promise<CausaMermaDto> {
    return this.causasService.cambiarEstado(id, true);
  }
}
