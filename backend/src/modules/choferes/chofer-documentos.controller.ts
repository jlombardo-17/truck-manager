import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChoferDocumentosService } from './chofer-documentos.service';
import { CreateChoferDocumentoDto, UpdateChoferDocumentoDto } from './dto/chofer-documento.dto';

@Controller('choferes/:choferId/documentos')
@UseGuards(JwtAuthGuard)
export class ChoferDocumentosController {
  constructor(private readonly documentosService: ChoferDocumentosService) {}

  @Get()
  async findByChofer(@Param('choferId') choferId: string) {
    return await this.documentosService.findByChoferId(parseInt(choferId));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.documentosService.findById(parseInt(id));
  }

  @Post()
  async create(@Param('choferId') choferId: string, @Body() createDto: CreateChoferDocumentoDto) {
    createDto.choferId = parseInt(choferId);
    return await this.documentosService.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateChoferDocumentoDto) {
    return await this.documentosService.update(parseInt(id), updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.documentosService.delete(parseInt(id));
    return { message: 'Documento eliminado correctamente' };
  }
}

@Controller('documentos')
@UseGuards(JwtAuthGuard)
export class DocumentosAlertasController {
  constructor(private readonly documentosService: ChoferDocumentosService) {}

  @Get('proximos-vencer')
  async findProximosAVencer(@Query('dias') dias?: string) {
    const diasNum = dias ? parseInt(dias) : 30;
    return await this.documentosService.findProximosAVencer(diasNum);
  }

  @Get('vencidos')
  async findVencidos() {
    return await this.documentosService.findVencidos();
  }
}
