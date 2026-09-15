import { ApiProperty } from '@nestjs/swagger';
import { StockSaborDto } from '../../inventario/dto/stock-sabor.dto';
import { MermaDto } from '../../mermas/dto/merma.dto';
import { ProduccionDto } from '../../produccion/dto/produccion.dto';
import { SalidaDto } from '../../salidas/dto/salida.dto';

export class PanelDto {
  @ApiProperty({ example: 1240, description: 'Paletas disponibles en total' })
  stockTotal: number;

  @ApiProperty({ type: [StockSaborDto], description: 'Stock de cada sabor' })
  sabores: StockSaborDto[];

  @ApiProperty({
    type: [StockSaborDto],
    description: 'Sabores activos en el mínimo o por debajo',
  })
  aReponer: StockSaborDto[];

  @ApiProperty({
    example: 2,
    description: 'Producciones que esperan su conteo de embolsado',
  })
  pendientesDeEmbolsar: number;

  @ApiProperty({ type: [ProduccionDto] })
  produccionesRecientes: ProduccionDto[];

  @ApiProperty({ type: [SalidaDto] })
  salidasRecientes: SalidaDto[];

  @ApiProperty({ type: [MermaDto] })
  mermasRecientes: MermaDto[];
}
