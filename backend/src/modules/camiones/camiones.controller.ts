import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CamionesService } from './camiones.service';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';

@UseGuards(JwtAuthGuard)
@Controller('camiones')
export class CamionesController {
  constructor(private readonly camionesService: CamionesService) {}

  @Get()
  findAll() {
    return this.camionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.camionesService.findOne(id);
  }

  @Post()
  create(@Body() createCamionDto: CreateCamionDto) {
    return this.camionesService.create(createCamionDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCamionDto: UpdateCamionDto,
  ) {
    return this.camionesService.update(id, updateCamionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.camionesService.remove(id);
  }
}
