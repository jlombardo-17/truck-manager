import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto, UpdateDocumentoDto } from './dto/documento.dto';

@UseGuards(JwtAuthGuard)
@Controller('camiones/:camionId/documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get()
  findByCamion(@Param('camionId', ParseIntPipe) camionId: number) {
    return this.documentosService.findByCamion(camionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentosService.findOne(id);
  }

  @Post()
  create(@Param('camionId', ParseIntPipe) camionId: number, @Body() createDocumentoDto: CreateDocumentoDto) {
    return this.documentosService.create(camionId, createDocumentoDto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDocumentoDto: UpdateDocumentoDto) {
    return this.documentosService.update(id, updateDocumentoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentosService.remove(id);
  }
}
