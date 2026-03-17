import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfiguracionVehicularService } from './configuracion-vehicular.service';
import { UpsertConfiguracionVehicularDto } from './dto/configuracion-vehicular.dto';

@UseGuards(JwtAuthGuard)
@Controller('camiones/:camionId/configuracion')
export class ConfiguracionVehicularController {
  constructor(private readonly service: ConfiguracionVehicularService) {}

  @Get()
  findByCamion(@Param('camionId', ParseIntPipe) camionId: number) {
    return this.service.findByCamion(camionId);
  }

  @Put()
  upsert(
    @Param('camionId', ParseIntPipe) camionId: number,
    @Body() dto: UpsertConfiguracionVehicularDto,
  ) {
    return this.service.upsert(camionId, dto);
  }

  @Delete()
  @HttpCode(200)
  async remove(@Param('camionId', ParseIntPipe) camionId: number) {
    await this.service.remove(camionId);
    return { message: 'Configuración eliminada' };
  }
}
