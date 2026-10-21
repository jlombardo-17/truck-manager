import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import { Camion } from '../camiones/camion.entity';
import { Chofer } from '../choferes/chofer.entity';
import { ChoferDocumento } from '../choferes/chofer-documento.entity';
import { ChoferSalarioPago } from '../choferes/chofer-salario-pago.entity';
import { addDaysDateOnly, diffDaysDateOnly, parseDateOnly, todayDateOnly } from '../../common/utils/date-only';
import { ReportesService } from '../reportes/reportes.service';

export interface DashboardResumen {
  ingresosDelMes: number;
  gastosDelMes: number;
  gananciaNetaDelMes: number;
  camionesActivos: number;
  viajesCompletados: number;
  // Mismo criterio de gastos que Reportes; los sueldos son los pagos reales del período
  detalleGastosDelMes: {
    operativosViaje: number;
    gastosViaje: number;
    sueldos: number;
    mantenimiento: number;
    gastosFijos: number;
  };
  mantenimientoPendiente: Array<{
    camionPatente: string;
    tipo: string;
    proximoVencimiento: Date;
  }>;
  documentosPorVencer: Array<{
    choferNombre: string;
    documentoTipo: string;
    diasRestantes: number;
  }>;
}

export interface DesempenoCamion {
  id: number;
  patente: string;
  ingresos: number;
  gastos: number;
  eficiencia: number; // Ganancia neta / Ingresos (%)
  kmRecorridos: number;
  viajesCompletos: number;
}

export interface DesempenoChofer {
  id: number;
  nombre: string;
  viajesCompletos: number;
  ingresos: number;
  comisiones: number;
  puntualidad: number; // % de viajes sin retrasos
}

@Injectable()
export class DashboardService {
  private tableColumnsCache = new Map<string, Promise<Set<string>>>();
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Viaje)
    private viajesRepository: Repository<Viaje>,
    @InjectRepository(Camion)
    private camionesRepository: Repository<Camion>,
    @InjectRepository(Chofer)
    private choferesRepository: Repository<Chofer>,
    @InjectRepository(ChoferDocumento)
    private choferDocumentosRepository: Repository<ChoferDocumento>,
    @InjectRepository(ChoferSalarioPago)
    private salarioPagoRepository: Repository<ChoferSalarioPago>,
    private reportesService: ReportesService,
  ) {}

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getIngresoViajeUyu(viaje: Viaje | Record<string, unknown>): number {
    const record = viaje as Record<string, unknown>;
    const ingresoUyu = this.toNumber(record.valorViajeUyu ?? record.valor_viaje_uyu);
    if (ingresoUyu > 0) {
      return ingresoUyu;
    }

    return this.toNumber(record.valorViaje ?? record.valor_viaje);
  }

  private formatChoferNombre(chofer?: Chofer): string {
    const nombreCompleto = `${chofer?.nombre || ''} ${chofer?.apellido || ''}`
      .replace(/\s+/g, ' ')
      .trim();
    return nombreCompleto;
  }

  private toId(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    if (!this.tableColumnsCache.has(tableName)) {
      this.tableColumnsCache.set(
        tableName,
        this.viajesRepository
          .query(`SHOW COLUMNS FROM ${tableName}`)
          .then((columns: Array<{ Field: string }>) => new Set(columns.map((column) => column.Field))),
      );
    }

    return this.tableColumnsCache.get(tableName)!;
  }

  private pickColumn(columns: Set<string>, candidates: string[]): string {
    const match = candidates.find((candidate) => columns.has(candidate));
    if (!match) {
      throw new Error(`No se encontró ninguna de las columnas esperadas: ${candidates.join(', ')}`);
    }
    return match;
  }

  private async getOptionalTableColumns(tableName: string): Promise<Set<string> | null> {
    try {
      return await this.getTableColumns(tableName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo inspeccionar la tabla ${tableName}: ${message}`);
      return null;
    }
  }

  private pickOptionalColumn(columns: Set<string> | null, candidates: string[]): string | null {
    if (!columns) {
      return null;
    }

    return candidates.find((candidate) => columns.has(candidate)) ?? null;
  }

  private async safeQuery<T>(label: string, fallback: T, callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Dashboard (${label}) omitido por error: ${message}`);
      return fallback;
    }
  }

  private parseQueryDate(value: string | undefined, endOfDay = false): Date | null {
    if (!value) {
      return null;
    }

    const parsed = parseDateOnly(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    if (endOfDay) {
      parsed.setHours(23, 59, 59, 999);
    } else {
      parsed.setHours(0, 0, 0, 0);
    }

    return parsed;
  }

  /**
   * Expresión SQL con la suma de comisiones/gastos listados en el viaje (no cancelados).
   * Devuelve '0' si la tabla o sus columnas no existen (Railway sin migrar).
   */
  private async getGastosViajeSelect(viajeAlias: string): Promise<string> {
    const viajeColumns = await this.getTableColumns('viajes');
    const viajeIdColumn = this.pickColumn(viajeColumns, ['id']);
    const comisionColumns = await this.getOptionalTableColumns('viajes_comisiones');
    const comisionViajeIdColumn = this.pickOptionalColumn(comisionColumns, ['viaje_id', 'viajeId']);
    const montoTotalColumn = this.pickOptionalColumn(comisionColumns, ['montoTotal', 'monto_total']);
    const estadoColumn = this.pickOptionalColumn(comisionColumns, ['estado']);

    if (!comisionViajeIdColumn || !montoTotalColumn) {
      return '0';
    }

    const estadoFilter = estadoColumn ? ` AND LOWER(c.${estadoColumn}) <> 'cancelado'` : '';
    return `COALESCE((
      SELECT SUM(c.${montoTotalColumn})
      FROM viajes_comisiones c
      WHERE c.${comisionViajeIdColumn} = ${viajeAlias}.${viajeIdColumn}${estadoFilter}
    ), 0)`;
  }

  private async getGastoSueldos(periodStart: Date, periodEnd: Date): Promise<number> {
    try {
      const pagosColumns = await this.getOptionalTableColumns('choferes_salarios_pagos');
      const fechaPagoColumn = this.pickOptionalColumn(pagosColumns, ['fecha_pago', 'fechaPago']);
      const montoColumn = this.pickOptionalColumn(pagosColumns, ['monto']);

      if (!fechaPagoColumn || !montoColumn) {
        return 0;
      }

      const pagosSueldosMes = await this.salarioPagoRepository.query(
        `
          SELECT ${montoColumn} AS monto
          FROM choferes_salarios_pagos
          WHERE ${fechaPagoColumn} >= ?
            AND ${fechaPagoColumn} <= ?
        `,
        [periodStart, periodEnd],
      );

      return pagosSueldosMes.reduce(
        (sum: number, pago: { monto: unknown }) => sum + this.toNumber(pago.monto),
        0,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Error al calcular gasto de sueldos: ${message}`);
      return 0;
    }
  }

  private getDateRange(fechaInicio?: string, fechaFin?: string): { start: Date; end: Date } {
    const ahora = new Date();
    let startDate: Date;
    let endDate: Date;

    const parsedStart = this.parseQueryDate(fechaInicio);
    const parsedEnd = this.parseQueryDate(fechaFin, true);

    if (parsedStart && parsedEnd) {
      startDate = parsedStart;
      endDate = parsedEnd;
    } else {
      // Default: últimos 30 días
      endDate = new Date(ahora);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(ahora);
      startDate.setDate(ahora.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    return { start: startDate, end: endDate };
  }

  async getResumen(fechaInicio?: string, fechaFin?: string): Promise<DashboardResumen> {
    try {
      const ahora = new Date();
      const { start: primerDia, end: ultimoDia } = this.getDateRange(fechaInicio, fechaFin);

      const viajeColumns = await this.getTableColumns('viajes');
      const valorViajeColumn = this.pickColumn(viajeColumns, ['valor_viaje_uyu', 'valorViajeUyu', 'valorViaje', 'valor_viaje']);
      const costoCombustibleColumn = this.pickColumn(viajeColumns, ['costoCombustible', 'costo_combustible']);
      const otrosGastosColumn = this.pickColumn(viajeColumns, ['otrosGastos', 'otros_gastos']);
      const estadoColumn = this.pickColumn(viajeColumns, ['estado']);
      const fechaInicioColumn = this.pickColumn(viajeColumns, ['fechaInicio', 'fecha_inicio']);
      const gastosViajeSelect = await this.getGastosViajeSelect('viajes');

      const viajesMes = await this.safeQuery(
        'viajes de resumen',
        [] as Array<{ valorViaje: unknown; costoCombustible: unknown; otrosGastos: unknown; gastosViaje: unknown }>,
        async () => {
          const rows = await this.viajesRepository.query(
            `
              SELECT
                ${valorViajeColumn} AS valorViaje,
                ${costoCombustibleColumn} AS costoCombustible,
                ${otrosGastosColumn} AS otrosGastos,
                ${gastosViajeSelect} AS gastosViaje
              FROM viajes
              WHERE LOWER(${estadoColumn}) = ?
                AND ${fechaInicioColumn} >= ?
                AND ${fechaInicioColumn} <= ?
            `,
            ['completado', primerDia, ultimoDia],
          );

          return Array.isArray(rows) ? rows : [];
        },
      );

      // Ingresos del período
      const ingresosDelMes = viajesMes.reduce(
        (sum, v) => sum + this.getIngresoViajeUyu(v),
        0,
      );

      const gastosOperativosViajes = viajesMes.reduce(
        (sum, viaje) => sum + this.toNumber(viaje.costoCombustible) + this.toNumber(viaje.otrosGastos),
        0,
      );

      const gastosCargadosViajes = viajesMes.reduce(
        (sum, viaje) => sum + this.toNumber(viaje.gastosViaje),
        0,
      );

      const gastoSueldos = await this.getGastoSueldos(primerDia, ultimoDia);

      // Mantenimiento (servicios + registros) y gastos fijos prorrateados: mismo cálculo que Reportes
      const costosCamion = await this.safeQuery(
        'costos de camiones (mantenimiento y gastos fijos)',
        new Map<number, { mantenimiento: number; gastosFijos: number }>(),
        async () => this.reportesService.getCostosCamionPorPeriodo(primerDia, ultimoDia),
      );
      let gastoMantenimiento = 0;
      let gastoFijos = 0;
      for (const costos of costosCamion.values()) {
        gastoMantenimiento += costos.mantenimiento;
        gastoFijos += costos.gastosFijos;
      }

      const gastosDelMes =
        gastosOperativosViajes +
        gastosCargadosViajes +
        gastoSueldos +
        gastoMantenimiento +
        gastoFijos;

      // Camiones activos: usar el estado operativo real del vehículo.
      const camionesActivos = await this.safeQuery(
        'camiones activos',
        0,
        async () => this.camionesRepository
          .createQueryBuilder('camion')
          .where('LOWER(camion.estado) IN (:...estados)', { estados: ['activo', 'operativo'] })
          .getCount(),
      );

      // Documentos por vencer (próximos 30 días)
      const hoy = todayDateOnly();
      const proximosMes = addDaysDateOnly(hoy, 30);

      const documentosPorVencer = await this.safeQuery(
        'documentos por vencer',
        [] as ChoferDocumento[],
        async () => this.choferDocumentosRepository
          .createQueryBuilder('doc')
          .leftJoinAndSelect('doc.chofer', 'chofer')
          .where('doc.fechaVencimiento IS NOT NULL')
          .andWhere('doc.fechaVencimiento <= :fecha', { fecha: proximosMes })
          .andWhere('doc.fechaVencimiento > :hoy', { hoy })
          .orderBy('doc.fechaVencimiento', 'ASC')
          .take(5)
          .getMany(),
      );

      const documentosFormato = documentosPorVencer
        .filter((doc) => doc.fechaVencimiento) // Validar que no sea null
        .map((doc) => {
          const diasRestantes = diffDaysDateOnly(hoy, doc.fechaVencimiento);
          return {
            choferNombre: doc.chofer?.nombre || 'Desconocido',
            documentoTipo: doc.tipo,
            diasRestantes,
          };
        });

      return {
        ingresosDelMes,
        gastosDelMes,
        gananciaNetaDelMes: ingresosDelMes - gastosDelMes,
        camionesActivos,
        viajesCompletados: viajesMes.length,
        detalleGastosDelMes: {
          operativosViaje: gastosOperativosViajes,
          gastosViaje: gastosCargadosViajes,
          sueldos: gastoSueldos,
          mantenimiento: gastoMantenimiento,
          gastosFijos: gastoFijos,
        },
        mantenimientoPendiente: [],
        documentosPorVencer: documentosFormato,
      };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error en getResumen: ${mensaje}`, error instanceof Error ? error.stack : '');
      // Retornar datos por defecto en caso de error
      return {
        ingresosDelMes: 0,
        gastosDelMes: 0,
        gananciaNetaDelMes: 0,
        camionesActivos: 0,
        viajesCompletados: 0,
        detalleGastosDelMes: {
          operativosViaje: 0,
          gastosViaje: 0,
          sueldos: 0,
          mantenimiento: 0,
          gastosFijos: 0,
        },
        mantenimientoPendiente: [],
        documentosPorVencer: [],
      };
    }
  }

  async getDesempenoCamiones(fechaInicio?: string, fechaFin?: string): Promise<DesempenoCamion[]> {
    const { start: primerDia, end: ultimoDia } = this.getDateRange(fechaInicio, fechaFin);
    const viajeColumns = await this.getTableColumns('viajes');
    const camionIdColumn = this.pickColumn(viajeColumns, ['camion_id', 'camionId']);
    const valorViajeColumn = this.pickColumn(viajeColumns, ['valor_viaje_uyu', 'valorViajeUyu', 'valorViaje', 'valor_viaje']);
    const costoCombustibleColumn = this.pickColumn(viajeColumns, ['costoCombustible', 'costo_combustible']);
    const otrosGastosColumn = this.pickColumn(viajeColumns, ['otrosGastos', 'otros_gastos']);
    const kmRecorridosColumn = this.pickColumn(viajeColumns, ['kmRecorridos', 'kms_recorridos', 'km_recorridos']);
    const estadoColumn = this.pickColumn(viajeColumns, ['estado']);
    const fechaInicioColumn = this.pickColumn(viajeColumns, ['fechaInicio', 'fecha_inicio']);
    const gastosViajeSelect = await this.getGastosViajeSelect('viajes');

    const viajesPorCamion = await this.viajesRepository.query(
      `
        SELECT
          ${camionIdColumn} AS camionId,
          ${valorViajeColumn} AS valorViaje,
          ${costoCombustibleColumn} AS costoCombustible,
          ${otrosGastosColumn} AS otrosGastos,
          ${gastosViajeSelect} AS gastosViaje,
          ${kmRecorridosColumn} AS kmRecorridos
        FROM viajes
        WHERE ${estadoColumn} = ?
          AND ${fechaInicioColumn} >= ?
          AND ${fechaInicioColumn} <= ?
      `,
      ['completado', primerDia, ultimoDia],
    );

    const camionIds = [
      ...new Set(
        viajesPorCamion
          .map((viaje) => this.toId(viaje.camionId))
          .filter((camionId): camionId is number => camionId !== null),
      ),
    ];
    const fallbackCamiones = camionIds.length === 0 && viajesPorCamion.length > 0
      ? await this.camionesRepository.find()
      : [];
    const camiones = camionIds.length > 0
      ? await this.camionesRepository.findBy({ id: In(camionIds) })
      : fallbackCamiones.length === 1
        ? fallbackCamiones
      : [];
    const camionesById = new Map(camiones.map((camion) => [camion.id, camion]));
    const fallbackCamion = camiones.length === 1 ? camiones[0] : undefined;

    // Agrupar por camión
    const camionesMap = new Map<number, any>();

    for (const viaje of viajesPorCamion) {
      const camionId = this.toId(viaje.camionId) ?? fallbackCamion?.id ?? null;
      if (camionId === null) {
        continue;
      }

      const camionInfo = camionesById.get(camionId);

      if (!camionesMap.has(camionId)) {
        camionesMap.set(camionId, {
          id: camionId,
          patente: camionInfo?.patente || `Camión #${camionId}`,
          ingresos: 0,
          gastosViaje: 0,
          kmRecorridos: 0,
          viajesCompletos: 0,
        });
      }

      const camion = camionesMap.get(camionId);
      camion.ingresos += this.toNumber(viaje.valorViaje);
      camion.gastosViaje +=
        this.toNumber(viaje.costoCombustible) +
        this.toNumber(viaje.otrosGastos) +
        this.toNumber(viaje.gastosViaje);
      camion.kmRecorridos += this.toNumber(viaje.kmRecorridos);
      camion.viajesCompletos += 1;
    }

    // Mantenimiento (servicios + registros) y gastos fijos prorrateados por camión, igual que Reportes
    const costosCamion = camionesMap.size > 0
      ? await this.reportesService.getCostosCamionPorPeriodo(primerDia, ultimoDia, Array.from(camionesMap.keys()))
      : new Map<number, { mantenimiento: number; gastosFijos: number }>();

    // Calcular eficiencia
    const resultado: DesempenoCamion[] = Array.from(camionesMap.values()).map(
      (camion) => {
        const costos = costosCamion.get(camion.id);
        const gastos = camion.gastosViaje + (costos?.mantenimiento || 0) + (costos?.gastosFijos || 0);
        const ganancia = camion.ingresos - gastos;
        const eficiencia =
          camion.ingresos > 0 ? (ganancia / camion.ingresos) * 100 : 0;

        return {
          ...camion,
          gastos,
          eficiencia: Math.round(eficiencia * 100) / 100,
        };
      },
    );

    return resultado.sort((a, b) => b.eficiencia - a.eficiencia);
  }

  async getDesempenoChoferes(fechaInicio?: string, fechaFin?: string): Promise<DesempenoChofer[]> {
    const { start: primerDia, end: ultimoDia } = this.getDateRange(fechaInicio, fechaFin);
    const viajeColumns = await this.getTableColumns('viajes');
    const comisionColumns = await this.getTableColumns('viajes_comisiones');
    const viajeIdColumn = this.pickColumn(viajeColumns, ['id']);
    const choferIdColumn = this.pickColumn(viajeColumns, ['chofer_id', 'choferId']);
    const valorViajeColumn = this.pickColumn(viajeColumns, ['valor_viaje_uyu', 'valorViajeUyu', 'valorViaje', 'valor_viaje']);
    const estadoColumn = this.pickColumn(viajeColumns, ['estado']);
    const fechaInicioColumn = this.pickColumn(viajeColumns, ['fechaInicio', 'fecha_inicio']);
    const comisionViajeIdColumn = this.pickColumn(comisionColumns, ['viaje_id', 'viajeId']);
    const montoTotalColumn = this.pickColumn(comisionColumns, ['montoTotal', 'monto_total']);

    const viajes = await this.viajesRepository.query(
      `
        SELECT
          v.${choferIdColumn} AS choferId,
          v.${valorViajeColumn} AS valorViaje,
          COALESCE(SUM(c.${montoTotalColumn}), 0) AS comisionesTotal
        FROM viajes v
        LEFT JOIN viajes_comisiones c ON c.${comisionViajeIdColumn} = v.${viajeIdColumn}
        WHERE v.${estadoColumn} = ?
          AND v.${fechaInicioColumn} >= ?
          AND v.${fechaInicioColumn} <= ?
        GROUP BY v.${viajeIdColumn}, v.${choferIdColumn}, v.${valorViajeColumn}
      `,
      ['completado', primerDia, ultimoDia],
    );

    const choferIds = [
      ...new Set(
        viajes
          .map((viaje) => this.toId(viaje.choferId))
          .filter((choferId): choferId is number => choferId !== null),
      ),
    ];
    const fallbackChoferes = choferIds.length === 0 && viajes.length > 0
      ? await this.choferesRepository.find()
      : [];
    const choferes = choferIds.length > 0
      ? await this.choferesRepository.findBy({ id: In(choferIds) })
      : fallbackChoferes.length === 1
        ? fallbackChoferes
      : [];
    const choferesById = new Map(choferes.map((chofer) => [chofer.id, chofer]));
    const fallbackChofer = choferes.length === 1 ? choferes[0] : undefined;

    // Agrupar por chofer
    const choferesMap = new Map<number, any>();

    for (const viaje of viajes) {
      const choferId = this.toId(viaje.choferId) ?? fallbackChofer?.id ?? null;
      if (choferId === null) {
        continue;
      }

      const choferInfo = choferesById.get(choferId);

      if (!choferesMap.has(choferId)) {
        const nombreCompleto = this.formatChoferNombre(choferInfo);
        choferesMap.set(choferId, {
          id: choferId,
          nombre: nombreCompleto || `Chofer #${choferId}`,
          viajesCompletos: 0,
          ingresos: 0,
          comisiones: 0,
          puntualidad: 100,
        });
      }

      const chofer = choferesMap.get(choferId);
      chofer.viajesCompletos += 1;
      chofer.ingresos += this.toNumber(viaje.valorViaje);
      chofer.comisiones += this.toNumber(viaje.comisionesTotal);
    }

    return Array.from(choferesMap.values()).sort(
      (a, b) => b.viajesCompletos - a.viajesCompletos,
    );
  }
}
