import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicio.dto';

@UseGuards(JwtAuthGuard)
@Controller('camiones/:camionId/servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Get()
  findByCamion(@Param('camionId', ParseIntPipe) camionId: number) {
    return this.serviciosService.findByCamion(camionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.findOne(id);
  }

  @Post()
  create(@Param('camionId', ParseIntPipe) camionId: number, @Body() createServicioDto: CreateServicioDto) {
    return this.serviciosService.create(camionId, createServicioDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateServicioDto: UpdateServicioDto) {
    return this.serviciosService.update(id, updateServicioDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }
}
