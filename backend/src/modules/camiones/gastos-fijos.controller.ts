import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GastosFijosService } from './gastos-fijos.service';
import { CreateGastoFijoDto, UpdateGastoFijoDto } from './dto/gasto-fijo.dto';

@UseGuards(JwtAuthGuard)
@Controller('camiones/:camionId/gastos-fijos')
export class GastosFijosController {
  constructor(private readonly gastosFijosService: GastosFijosService) {}

  @Get()
  findByCamion(@Param('camionId', ParseIntPipe) camionId: number) {
    return this.gastosFijosService.findByCamion(camionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gastosFijosService.findOne(id);
  }

  @Post()
  create(@Param('camionId', ParseIntPipe) camionId: number, @Body() createGastoFijoDto: CreateGastoFijoDto) {
    return this.gastosFijosService.create(camionId, createGastoFijoDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateGastoFijoDto: UpdateGastoFijoDto) {
    return this.gastosFijosService.update(id, updateGastoFijoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gastosFijosService.remove(id);
  }
}
