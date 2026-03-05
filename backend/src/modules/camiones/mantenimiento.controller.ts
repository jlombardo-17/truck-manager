import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MantenimientoService } from './mantenimiento.service';
import {
  CreateMantenimientoTipoDto,
  UpdateMantenimientoTipoDto,
  CreateMantenimientoRegistroDto,
  UpdateMantenimientoRegistroDto,
} from './dto/mantenimiento.dto';

@Controller('mantenimiento')
@UseGuards(JwtAuthGuard)
export class MantenimientoController {
  constructor(private readonly mantenimientoService: MantenimientoService) {}

  // ============ TIPOS DE MANTENIMIENTO ============

  @Get('tipos')
  async getAllTipos() {
    return await this.mantenimientoService.getAllTipos();
  }

  @Get('tipos/:id')
  async getTipoById(@Param('id') id: string) {
    return await this.mantenimientoService.getTipoById(parseInt(id));
  }

  @Post('tipos')
  async createTipo(@Body() dto: CreateMantenimientoTipoDto) {
    return await this.mantenimientoService.createTipo(dto);
  }

  @Put('tipos/:id')
  async updateTipo(@Param('id') id: string, @Body() dto: UpdateMantenimientoTipoDto) {
    return await this.mantenimientoService.updateTipo(parseInt(id), dto);
  }

  @Delete('tipos/:id')
  async deleteTipo(@Param('id') id: string) {
    await this.mantenimientoService.deleteTipo(parseInt(id));
    return { message: 'Tipo de mantenimiento eliminado' };
  }

  // ============ REGISTROS DE MANTENIMIENTO ============

  @Get('camion/:camionId')
  async getRegistrosByCamion(@Param('camionId') camionId: string) {
    return await this.mantenimientoService.getRegistrosByCamion(parseInt(camionId));
  }

  @Get('registro/:id')
  async getRegistroById(@Param('id') id: string) {
    return await this.mantenimientoService.getRegistroById(parseInt(id));
  }

  @Post('registro')
  async createRegistro(@Body() dto: CreateMantenimientoRegistroDto) {
    return await this.mantenimientoService.createRegistro(dto);
  }

  @Put('registro/:id')
  async updateRegistro(@Param('id') id: string, @Body() dto: UpdateMantenimientoRegistroDto) {
    return await this.mantenimientoService.updateRegistro(parseInt(id), dto);
  }

  @Delete('registro/:id')
  async deleteRegistro(@Param('id') id: string) {
    await this.mantenimientoService.deleteRegistro(parseInt(id));
    return { message: 'Registro de mantenimiento eliminado' };
  }

  @Put('registro/:id/completar')
  async marcarComoCompletado(
    @Param('id') id: string,
    @Body() body: { costoReal?: number; observaciones?: string },
  ) {
    return await this.mantenimientoService.marcarComoCompletado(
      parseInt(id),
      body.costoReal,
      body.observaciones,
    );
  }

  // ============ ALERTAS ============

  @Get('alertas/proximos-vencer')
  async getProximosAVencer(
    @Query('camionId') camionId?: string,
    @Query('dias') dias?: string,
  ) {
    const diasNum = dias ? parseInt(dias) : 30;
    const camionIdNum = camionId ? parseInt(camionId) : undefined;
    return await this.mantenimientoService.getProximosAVencer(camionIdNum, diasNum);
  }

  @Get('alertas/vencidos')
  async getVencidos(@Query('camionId') camionId?: string) {
    const camionIdNum = camionId ? parseInt(camionId) : undefined;
    return await this.mantenimientoService.getVencidos(camionIdNum);
  }

  @Get('estadisticas/camion/:camionId')
  async getEstadisticasCamion(@Param('camionId') camionId: string) {
    return await this.mantenimientoService.getEstadisticasCamion(parseInt(camionId));
  }
}
