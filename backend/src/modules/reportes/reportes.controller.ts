import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { parseDateOnly } from '../../common/utils/date-only';

const parseIds = (value?: string): number[] | undefined => {
  if (!value) return undefined;
  const parsed = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num) && num > 0);
  return parsed.length > 0 ? parsed : undefined;
};

// 'YYYY-MM-DD' en hora local: desde = inicio del día, hasta = fin del día (incluye el último día)
const parseDesde = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = parseDateOnly(value);
  return Number.isNaN(date.getTime()) ? new Date(value) : date;
};

const parseHasta = (value?: string): Date | undefined => {
  const date = parseDesde(value);
  date?.setHours(23, 59, 59, 999);
  return date;
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
    @Query('usarFechaPago') usarFechaPago?: string,
  ) {
    const parsedCamionIds = parseIds(camionIds) || (camionId ? [Number(camionId)] : undefined);
    const parsedChoferIds = parseIds(choferIds) || (choferId ? [Number(choferId)] : undefined);

    return this.reportesService.getRentabilidad({
      granularidad,
      camionIds: parsedCamionIds,
      choferIds: parsedChoferIds,
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
      usarFechaPago: usarFechaPago === 'true',
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
    @Query('usarFechaPago') usarFechaPago?: string,
  ) {
    const parsedCamionIds = parseIds(camionIds) || (camionId ? [Number(camionId)] : undefined);
    const parsedChoferIds = parseIds(choferIds) || (choferId ? [Number(choferId)] : undefined);

    return this.reportesService.getRentabilidadComparativa({
      compararPor,
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
      camionIds: parsedCamionIds,
      choferIds: parsedChoferIds,
      usarFechaPago: usarFechaPago === 'true',
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
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
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
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
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
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
      camionIds: parseIds(camionIds),
    });
  }

  @Get('gastos-fijos')
  async getGastosFijos(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('camionIds') camionIds?: string,
  ) {
    return this.reportesService.getGastosFijos({
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
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
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
      camionIds: parseIds(camionIds),
      choferIds: parseIds(choferIds),
    });
  }

  @Get('flujo-caja')
  async getFlujoCaja(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('camionIds') camionIds?: string,
    @Query('choferIds') choferIds?: string,
  ) {
    return this.reportesService.getFlujoCaja({
      desde: parseDesde(desde),
      hasta: parseHasta(hasta),
      camionIds: parseIds(camionIds),
      choferIds: parseIds(choferIds),
    });
  }
}
