import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ViaticoTiposService } from './viatico-tipos.service';
import { CreateViaticoTipoDto, UpdateViaticoTipoDto } from './dto/jornada.dto';
import { ViaticoTipo } from './viatico-tipo.entity';

@Controller('viatico-tipos')
@UseGuards(JwtAuthGuard)
export class ViaticoTiposController {
  constructor(private readonly viaticoTiposService: ViaticoTiposService) {}

  /**
   * Listar tipos de viático (?todos=true incluye inactivos)
   */
  @Get()
  async findAll(@Query('todos') todos?: string): Promise<ViaticoTipo[]> {
    return await this.viaticoTiposService.findAll(todos === 'true');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ViaticoTipo> {
    return await this.viaticoTiposService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateViaticoTipoDto): Promise<ViaticoTipo> {
    return await this.viaticoTiposService.create(dto);
  }

  /**
   * Actualizar (para dar de baja usar activo=false)
   */
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateViaticoTipoDto): Promise<ViaticoTipo> {
    return await this.viaticoTiposService.update(id, dto);
  }
}
