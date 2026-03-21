import { Injectable } from '@nestjs/common';
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

  async getResumen(): Promise<DashboardResumen> {
    const ahora = new Date();
    const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ultimoDiaDelMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 1,
      0,
    );
    ultimoDiaDelMes.setHours(23, 59, 59, 999);

    // Viajes completados del mes
    const viajesMes = await this.viajesRepository.find({
      relations: ['camion', 'chofer'],
      where: {
        estado: 'completado' as any,
        fechaInicio: Between(primerDiaDelMes, ultimoDiaDelMes) as any,
      },
    });

    // Ingresos del mes
    const ingresosDelMes = viajesMes.reduce(
      (sum, v) => sum + this.toNumber(v.valorViaje),
      0,
    );

    const gastosOperativosViajes = viajesMes.reduce(
      (sum, viaje) => sum + this.toNumber(viaje.costoCombustible) + this.toNumber(viaje.otrosGastos),
      0,
    );

    const mantenimientoMes = await this.mantenimientoRepository.find({
      relations: ['camion'],
      where: {
        fechaPrograma: Between(primerDiaDelMes, ultimoDiaDelMes) as any,
      },
    });

    const gastoMantenimiento = mantenimientoMes.reduce(
      (sum, m) => sum + this.toNumber(m.costoReal),
      0,
    );

    const pagosSueldosMes = await this.salarioPagoRepository.find({
      where: {
        fechaPago: Between(primerDiaDelMes, ultimoDiaDelMes) as any,
      },
    });

    const gastoSueldos = pagosSueldosMes.reduce(
      (sum, pago) => sum + this.toNumber(pago.monto),
      0,
    );

    const documentosCamionMes = await this.documentosCamionRepository
      .createQueryBuilder('documento')
      .where('documento.created_at >= :desde', { desde: primerDiaDelMes })
      .andWhere('documento.created_at <= :hasta', { hasta: ultimoDiaDelMes })
      .andWhere('documento.costo IS NOT NULL')
      .getMany();

    const gastoDocumentosCamion = documentosCamionMes.reduce(
      (sum, documento) => sum + this.toNumber(documento.costo),
      0,
    );

    const gastosDelMes =
      gastosOperativosViajes +
      gastoSueldos +
      gastoMantenimiento +
      gastoDocumentosCamion;

    // Camiones activos: usar el estado operativo real del vehículo.
    const camionesActivos = await this.camionesRepository.count({
      where: {
        estado: 'activo',
      },
    });

    // Documentos por vencer (próximos 30 días)
    const proximosMes = new Date();
    proximosMes.setDate(proximosMes.getDate() + 30);

    const documentosPorVencer = await this.choferDocumentosRepository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.chofer', 'chofer')
      .where('doc.fechaVencimiento <= :fecha', { fecha: proximosMes })
      .andWhere('doc.fechaVencimiento > :ahora', { ahora })
      .orderBy('doc.fechaVencimiento', 'ASC')
      .take(5)
      .getMany();

    const documentosFormato = documentosPorVencer.map((doc) => {
      const diasRestantes = Math.ceil(
        (doc.fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24),
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
      mantenimientoPendiente: [],
      documentosPorVencer: documentosFormato,
    };
  }

  async getDesempenoCamiones(): Promise<DesempenoCamion[]> {
    const ahora = new Date();
    const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ultimoDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    const viajeColumns = await this.getTableColumns('viajes');
    const camionIdColumn = this.pickColumn(viajeColumns, ['camion_id', 'camionId']);
    const valorViajeColumn = this.pickColumn(viajeColumns, ['valorViaje', 'valor_viaje']);
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
      ['completado', primerDiaDelMes, ultimoDiaDelMes],
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
        fechaPrograma: Between(primerDiaDelMes, ultimoDiaDelMes) as any,
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

    const documentosCamionMes = await this.documentosCamionRepository
      .createQueryBuilder('documento')
      .where('documento.created_at >= :desde', { desde: primerDiaDelMes })
      .andWhere('documento.created_at <= :hasta', { hasta: ultimoDiaDelMes })
      .andWhere('documento.costo IS NOT NULL')
      .getMany();

    documentosCamionMes.forEach((documento) => {
      const camionId = documento.camionId;
      if (!gastosMap.has(camionId)) gastosMap.set(camionId, 0);
      gastosMap.set(camionId, gastosMap.get(camionId) + this.toNumber(documento.costo));
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

  async getDesempenoChoferes(): Promise<DesempenoChofer[]> {
    const ahora = new Date();
    const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ultimoDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    const viajeColumns = await this.getTableColumns('viajes');
    const comisionColumns = await this.getTableColumns('viajes_comisiones');
    const viajeIdColumn = this.pickColumn(viajeColumns, ['id']);
    const choferIdColumn = this.pickColumn(viajeColumns, ['chofer_id', 'choferId']);
    const valorViajeColumn = this.pickColumn(viajeColumns, ['valorViaje', 'valor_viaje']);
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
      ['completado', primerDiaDelMes, ultimoDiaDelMes],
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
