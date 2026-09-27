import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JornadasService } from './jornadas.service';
import { BulkJornadaDto, JornadasQueryDto, ResumenQueryDto, UpsertJornadaDto } from './dto/jornada.dto';

@Controller('jornadas')
@UseGuards(JwtAuthGuard)
export class JornadasController {
  constructor(private readonly jornadasService: JornadasService) {}

  /**
   * Jornadas (con viáticos) de los choferes en el rango, más días sugeridos por viajes
   */
  @Get()
  async findByRango(@Query() query: JornadasQueryDto) {
    return await this.jornadasService.findByRango(
      this.jornadasService.parseIds(query.choferIds),
      query.desde,
      query.hasta,
    );
  }

  /**
   * Resumen mensual por chofer: días por categoría y total de viáticos
   */
  @Get('resumen')
  async resumen(@Query() query: ResumenQueryDto) {
    return await this.jornadasService.resumen(
      this.jornadasService.parseIds(query.choferIds),
      query.anio,
      query.mes,
    );
  }

  /**
   * Crear o actualizar la jornada de un chofer en una fecha (reemplaza sus viáticos si se envían)
   */
  @Put()
  async upsert(@Body() dto: UpsertJornadaDto) {
    return await this.jornadasService.upsert(dto);
  }

  /**
   * Aplicar una categoría a varios choferes en un rango de fechas
   */
  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  async bulk(@Body() dto: BulkJornadaDto) {
    return await this.jornadasService.bulk(dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.jornadasService.remove(id);
  }
}
