import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import { Camion } from '../camiones/camion.entity';
import { Chofer } from '../choferes/chofer.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { Documento } from '../camiones/documento.entity';
import { ChoferDocumento } from '../choferes/chofer-documento.entity';
import { ChoferSalarioPago } from '../choferes/chofer-salario-pago.entity';

export interface DashboardResumen {
  ingresosDelMes: number;
  gastosDelMes: number;
  gananciaNetaDelMes: number;
  camionesActivos: number;
  viajesCompletados: number;
  detalleGastosDelMes: {
    operativosViaje: number;
    sueldos: number;
    mantenimiento: number;
    documentosFijos: number;
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
    @InjectRepository(MantenimientoRegistro)
    private mantenimientoRepository: Repository<MantenimientoRegistro>,
    @InjectRepository(Documento)
    private documentosCamionRepository: Repository<Documento>,
    @InjectRepository(ChoferDocumento)
    private choferDocumentosRepository: Repository<ChoferDocumento>,
    @InjectRepository(ChoferSalarioPago)
    private salarioPagoRepository: Repository<ChoferSalarioPago>,
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

  private getDocumentoCoverageDays(documento: Documento): number {
    if (!documento.fechaVencimiento || !documento.createdAt) {
      return 365;
    }

    const start = new Date(documento.createdAt);
    const end = new Date(documento.fechaVencimiento);
    const days = this.getDaysInclusive(start, end);
    return days > 0 ? days : 365;
  }

  private getDaysInclusive(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  private getProjectedDocumentCostForPeriod(documento: Documento, start: Date, end: Date): number {
    const costo = this.toNumber(documento.costo);
    if (costo <= 0) {
      return 0;
    }

    const projectionDays = this.getDaysInclusive(start, end);
    return (costo / this.getDocumentoCoverageDays(documento)) * projectionDays;
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

    const parsed = new Date(value);
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

      const viajesMes = await this.safeQuery(
        'viajes de resumen',
        [] as Array<{ valorViaje: unknown; costoCombustible: unknown; otrosGastos: unknown }>,
        async () => {
          const rows = await this.viajesRepository.query(
            `
              SELECT
                ${valorViajeColumn} AS valorViaje,
                ${costoCombustibleColumn} AS costoCombustible,
                ${otrosGastosColumn} AS otrosGastos
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

      const mantenimientoColumns = await this.getOptionalTableColumns('mantenimiento_registros');
      const fechaProgramaColumn = this.pickOptionalColumn(mantenimientoColumns, ['fechaPrograma', 'fecha_programa']);
      const costoRealColumn = this.pickOptionalColumn(mantenimientoColumns, ['costoReal', 'costo_real']);

      const gastosMantenimientoRows = fechaProgramaColumn && costoRealColumn
        ? await this.safeQuery(
            'mantenimiento de resumen',
            [] as Array<{ costoReal: unknown }>,
            async () => {
              const rows = await this.mantenimientoRepository.query(
                `
                  SELECT ${costoRealColumn} AS costoReal
                  FROM mantenimiento_registros
                  WHERE ${fechaProgramaColumn} >= ?
                    AND ${fechaProgramaColumn} <= ?
                `,
                [primerDia, ultimoDia],
              );
              return Array.isArray(rows) ? rows : [];
            },
          )
        : [];

      const gastoMantenimiento = gastosMantenimientoRows.reduce(
        (sum, row) => sum + this.toNumber(row.costoReal),
        0,
      );

      const gastoSueldos = await this.getGastoSueldos(primerDia, ultimoDia);

      const documentosCamion = await this.safeQuery(
        'documentos de camion para prorrateo',
        [] as Documento[],
        async () => this.documentosCamionRepository.find(),
      );

      const gastoDocumentosCamion = documentosCamion.reduce(
        (sum, documento) => sum + this.getProjectedDocumentCostForPeriod(documento, primerDia, ultimoDia),
        0,
      );

      const gastosDelMes =
        gastosOperativosViajes +
        gastoSueldos +
        gastoMantenimiento +
        gastoDocumentosCamion;

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
      const proximosMes = new Date();
      proximosMes.setDate(proximosMes.getDate() + 30);

      const documentosPorVencer = await this.safeQuery(
        'documentos por vencer',
        [] as ChoferDocumento[],
        async () => this.choferDocumentosRepository
          .createQueryBuilder('doc')
          .leftJoinAndSelect('doc.chofer', 'chofer')
          .where('doc.fechaVencimiento IS NOT NULL')
          .andWhere('doc.fechaVencimiento <= :fecha', { fecha: proximosMes })
          .andWhere('doc.fechaVencimiento > :ahora', { ahora })
          .orderBy('doc.fechaVencimiento', 'ASC')
          .take(5)
          .getMany(),
      );

      const documentosFormato = documentosPorVencer
        .filter((doc) => doc.fechaVencimiento) // Validar que no sea null
        .map((doc) => {
          const diasRestantes = Math.ceil(
            (doc.fechaVencimiento!.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24),
          );
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
          sueldos: gastoSueldos,
          mantenimiento: gastoMantenimiento,
          documentosFijos: gastoDocumentosCamion,
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
          sueldos: 0,
          mantenimiento: 0,
          documentosFijos: 0,
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

    const viajesPorCamion = await this.viajesRepository.query(
      `
        SELECT
          ${camionIdColumn} AS camionId,
          ${valorViajeColumn} AS valorViaje,
          ${costoCombustibleColumn} AS costoCombustible,
          ${otrosGastosColumn} AS otrosGastos,
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
        this.toNumber(viaje.otrosGastos);
      camion.kmRecorridos += this.toNumber(viaje.kmRecorridos);
      camion.viajesCompletos += 1;
    }

    const mantenimientos = await this.mantenimientoRepository.find({
      relations: ['camion'],
      where: {
        fechaPrograma: Between(primerDia, ultimoDia) as any,
      },
    });

    // Agrupar gastos de mantenimiento por camión
    const gastosMap = new Map<number, number>();

    mantenimientos.forEach((m) => {
      const camionId = m.camionId;
      if (!gastosMap.has(camionId)) gastosMap.set(camionId, 0);
      gastosMap.set(
        camionId,
        gastosMap.get(camionId) + this.toNumber(m.costoReal),
      );
    });

    const documentosCamion = await this.documentosCamionRepository.find();

    documentosCamion.forEach((documento) => {
      const camionId = documento.camionId;
      if (!gastosMap.has(camionId)) gastosMap.set(camionId, 0);
      gastosMap.set(
        camionId,
        gastosMap.get(camionId) + this.getProjectedDocumentCostForPeriod(documento, primerDia, ultimoDia),
      );
    });

    // Calcular eficiencia
    const resultado: DesempenoCamion[] = Array.from(camionesMap.values()).map(
      (camion) => {
        const gastos = camion.gastosViaje + (gastosMap.get(camion.id) || 0);
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
