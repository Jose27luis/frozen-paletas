import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../common/decoradores/publico.decorator';
import { HealthDto } from './dto/health.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Publico()
  @Get()
  @ApiOperation({
    summary: 'Comprobar que la API y la base de datos responden',
  })
  @ApiOkResponse({ type: HealthDto })
  comprobar(): Promise<HealthDto> {
    return this.healthService.comprobar();
  }
}
