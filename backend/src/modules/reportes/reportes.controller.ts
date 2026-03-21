import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';

const parseIds = (value?: string): number[] | undefined => {
  if (!value) return undefined;
  const parsed = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num) && num > 0);
  return parsed.length > 0 ? parsed : undefined;
};

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('rentabilidad')
  async getRentabilidad(
    @Query('granularidad') granularidad: 'diaria' | 'semanal' | 'mensual' = 'diaria',
    @Query('camionId') camionId?: string,
    @Query('choferId') choferId?: string,
    @Query('camionIds') camionIds?: string,
    @Query('choferIds') choferIds?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const parsedCamionIds = parseIds(camionIds) || (camionId ? [Number(camionId)] : undefined);
    const parsedChoferIds = parseIds(choferIds) || (choferId ? [Number(choferId)] : undefined);

    return this.reportesService.getRentabilidad({
      granularidad,
      camionIds: parsedCamionIds,
      choferIds: parsedChoferIds,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
    });
  }

  @Get('rentabilidad/comparativa')
  async getRentabilidadComparativa(
    @Query('compararPor') compararPor: 'camion' | 'chofer' = 'camion',
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('camionId') camionId?: string,
    @Query('choferId') choferId?: string,
    @Query('camionIds') camionIds?: string,
    @Query('choferIds') choferIds?: string,
  ) {
    const parsedCamionIds = parseIds(camionIds) || (camionId ? [Number(camionId)] : undefined);
    const parsedChoferIds = parseIds(choferIds) || (choferId ? [Number(choferId)] : undefined);

    return this.reportesService.getRentabilidadComparativa({
      compararPor,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      camionIds: parsedCamionIds,
      choferIds: parsedChoferIds,
    });
  }

  @Get('operacion/camion/:camionId')
  async getOperacionCamion(
    @Param('camionId') camionIdParam: string,
    @Query('granularidad') granularidad: 'diaria' | 'semanal' | 'mensual' = 'diaria',
    @Query('desde') desde: string | undefined,
    @Query('hasta') hasta: string | undefined,
  ) {
    const camionId = camionIdParam ? Number(camionIdParam) : undefined;
    if (!camionId) {
      return { message: 'camionId es requerido' };
    }

    return this.reportesService.getOperacionCamion({
      camionId,
      granularidad,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
    });
  }

  // Reportes adicionales
  @Get('desempenio-choferes')
  async getDesempenoChoferes(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('choferIds') choferIds?: string,
  ) {
    return this.reportesService.getDesempenoChoferes({
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      choferIds: parseIds(choferIds),
    });
  }

  @Get('gastos-mantenimiento')
  async getGastosMantenimiento(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('camionIds') camionIds?: string,
  ) {
    return this.reportesService.getGastosMantenimiento({
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      camionIds: parseIds(camionIds),
    });
  }

  @Get('gastos-documentales')
  async getGastosDocumentales(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('camionIds') camionIds?: string,
  ) {
    return this.reportesService.getGastosDocumentales({
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      camionIds: parseIds(camionIds),
    });
  }

  @Get('ingresos-mensuales')
  async getIngresosMS(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('camionIds') camionIds?: string,
    @Query('choferIds') choferIds?: string,
  ) {
    return this.reportesService.getIngresosMS({
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      camionIds: parseIds(camionIds),
      choferIds: parseIds(choferIds),
    });
  }
}
