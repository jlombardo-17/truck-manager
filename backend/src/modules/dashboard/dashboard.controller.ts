import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  async getResumen() {
    return this.dashboardService.getResumen();
  }

  @Get('camiones')
  async getDesempenoCamiones() {
    return this.dashboardService.getDesempenoCamiones();
  }

  @Get('choferes')
  async getDesempenoChoferes() {
    return this.dashboardService.getDesempenoChoferes();
  }
}
