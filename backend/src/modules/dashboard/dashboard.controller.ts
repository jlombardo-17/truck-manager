import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  async getResumen(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.dashboardService.getResumen(fechaInicio, fechaFin);
  }

  @Get('camiones')
  async getDesempenoCamiones(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.dashboardService.getDesempenoCamiones(fechaInicio, fechaFin);
  }

  @Get('choferes')
  async getDesempenoChoferes(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.dashboardService.getDesempenoChoferes(fechaInicio, fechaFin);
  }
}
