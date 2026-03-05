import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChoferDocumentosService } from './chofer-documentos.service';
import { CreateChoferDocumentoDto, UpdateChoferDocumentoDto } from './dto/chofer-documento.dto';

@Controller('choferes-documentos')
export class ChoferDocumentosController {
  constructor(private readonly documentosService: ChoferDocumentosService) {}

  // Las rutas más específicas primero
  @Get('alertas/proximos-vencer')
  @UseGuards(JwtAuthGuard)
  async findProximosAVencer(@Query('dias') dias?: string) {
    const diasNum = dias ? parseInt(dias) : 30;
    return await this.documentosService.findProximosAVencer(diasNum);
  }

  @Get('alertas/vencidos')
  @UseGuards(JwtAuthGuard)
  async findVencidos() {
    return await this.documentosService.findVencidos();
  }

  @Get('chofer/:choferId')
  @UseGuards(JwtAuthGuard)
  async findByChofer(@Param('choferId') choferId: string) {
    return await this.documentosService.findByChoferId(parseInt(choferId));
  }

  // Rutas genéricas al final
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.documentosService.findById(parseInt(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDto: CreateChoferDocumentoDto) {
    return await this.documentosService.create(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateDto: UpdateChoferDocumentoDto) {
    return await this.documentosService.update(parseInt(id), updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    await this.documentosService.delete(parseInt(id));
    return { message: 'Documento eliminado correctamente' };
  }
}
