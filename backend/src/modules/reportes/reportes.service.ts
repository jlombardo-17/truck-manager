import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Camion } from '../camiones/camion.entity';

type Granularidad = 'diaria' | 'mensual';
type GranularidadOperacion = 'diaria' | 'semanal';

interface RentabilidadFilters {
  granularidad: Granularidad;
  camionIds?: number[];
  choferIds?: number[];
  desde: Date;
  hasta: Date;
}

interface BucketAccumulator {
  ingresos: number;
  gastosOperativos: number;
  gastosComisionChofer: number;
  gastosSueldoChofer: number;
  gastosMantenimiento: number;
  kmRecorridos: number;
  choferIds: Set<number>;
}

interface OperacionBucket {
  kms: number;
  toneladas: number;
}

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Viaje)
    private readonly viajeRepository: Repository<Viaje>,
    @InjectRepository(MantenimientoRegistro)
    private readonly mantenimientoRepository: Repository<MantenimientoRegistro>,
    @InjectRepository(Chofer)
    private readonly choferRepository: Repository<Chofer>,
    @InjectRepository(Camion)
    private readonly camionRepository: Repository<Camion>,
  ) {}

  async getRentabilidad(filters: Partial<RentabilidadFilters>) {
    const granularidad: Granularidad = filters.granularidad || 'diaria';
    const hasta = filters.hasta || new Date();
    const desde =
      filters.desde ||
      (granularidad === 'diaria'
        ? new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000)
        : new Date(hasta.getFullYear(), hasta.getMonth() - 5, 1));

    const parsedFilters: RentabilidadFilters = {
      granularidad,
      camionIds: filters.camionIds,
      choferIds: filters.choferIds,
      desde,
      hasta,
    };

    const viajes = await this.getViajes(parsedFilters);
    const buckets = new Map<string, BucketAccumulator>();
    const choferesById = new Map<number, Chofer>();

    for (const viaje of viajes) {
      const key = this.toBucketKey(viaje.fechaInicio, granularidad);
      const bucket = this.ensureBucket(buckets, key);
      const ingreso = this.toNumber(viaje.valorViaje);
      const gastoCombustible = this.toNumber(viaje.costoCombustible);
      const otrosGastos = this.toNumber(viaje.otrosGastos);
      const kmRecorridos = this.toNumber(viaje.kmRecorridos);
      const porcentajeComision = this.toNumber(viaje.chofer?.porcentajeComision);

      bucket.ingresos += ingreso;
      bucket.gastosOperativos += gastoCombustible + otrosGastos;
      bucket.gastosComisionChofer += (ingreso * porcentajeComision) / 100;
      bucket.kmRecorridos += kmRecorridos;

      if (viaje.choferId) {
        bucket.choferIds.add(viaje.choferId);
      }

      if (viaje.chofer?.id) {
        choferesById.set(viaje.chofer.id, viaje.chofer);
      }
    }

    await this.addSueldoToBuckets(buckets, choferesById, granularidad);
    await this.addMantenimientoToBuckets(buckets, parsedFilters);

    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => {
        const gastosTotales =
          bucket.gastosOperativos +
          bucket.gastosComisionChofer +
          bucket.gastosSueldoChofer +
          bucket.gastosMantenimiento;
        const gananciaNeta = bucket.ingresos - gastosTotales;

        return {
          periodo: key,
          etiqueta: this.formatLabel(key, granularidad),
          ingresos: this.round2(bucket.ingresos),
          gastos: this.round2(gastosTotales),
          gananciaNeta: this.round2(gananciaNeta),
          kmRecorridos: this.round2(bucket.kmRecorridos),
          detalleGastos: {
            operativosViaje: this.round2(bucket.gastosOperativos),
            comisionChofer: this.round2(bucket.gastosComisionChofer),
            sueldoChofer: this.round2(bucket.gastosSueldoChofer),
            mantenimiento: this.round2(bucket.gastosMantenimiento),
          },
        };
      });

    const resumen = series.reduce(
      (acc, point) => {
        acc.totalIngresos += point.ingresos;
        acc.totalGastos += point.gastos;
        acc.totalGananciaNeta += point.gananciaNeta;
        return acc;
      },
      { totalIngresos: 0, totalGastos: 0, totalGananciaNeta: 0 },
    );

    return {
      filtrosAplicados: {
        granularidad,
        camionIds: parsedFilters.camionIds,
        choferIds: parsedFilters.choferIds,
        desde: parsedFilters.desde.toISOString().split('T')[0],
        hasta: parsedFilters.hasta.toISOString().split('T')[0],
      },
      resumen: {
        totalIngresos: this.round2(resumen.totalIngresos),
        totalGastos: this.round2(resumen.totalGastos),
        totalGananciaNeta: this.round2(resumen.totalGananciaNeta),
      },
      series,
    };
  }

  async getRentabilidadComparativa(filters: {
    compararPor: 'camion' | 'chofer';
    desde?: Date;
    hasta?: Date;
    camionIds?: number[];
    choferIds?: number[];
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    const viajes = await this.getViajes({
      granularidad: 'diaria',
      desde,
      hasta,
      camionIds: filters.camionIds,
      choferIds: filters.choferIds,
    });

    const buckets = new Map<string, {
      id: number;
      label: string;
      ingresos: number;
      gastosOperativos: number;
      gastosComisionChofer: number;
      choferIds: Set<number>;
    }>();
    const choferesById = new Map<number, Chofer>();

    for (const viaje of viajes) {
      const key =
        filters.compararPor === 'camion'
          ? `camion-${viaje.camionId}`
          : `chofer-${viaje.choferId}`;

      if (!buckets.has(key)) {
        buckets.set(key, {
          id: filters.compararPor === 'camion' ? viaje.camionId : viaje.choferId,
          label:
            filters.compararPor === 'camion'
              ? (viaje.camion?.patente
                  ? `${viaje.camion.patente}${viaje.camion?.marca ? ` - ${viaje.camion.marca}` : ''}`
                  : `Camión #${viaje.camionId}`)
              : (`${viaje.chofer?.nombre || ''} ${viaje.chofer?.apellido || ''}`.trim() || `Chofer #${viaje.choferId}`),
          ingresos: 0,
          gastosOperativos: 0,
          gastosComisionChofer: 0,
          choferIds: new Set<number>(),
        });
      }

      const bucket = buckets.get(key)!;
      const ingreso = this.toNumber(viaje.valorViaje);
      bucket.ingresos += ingreso;
      bucket.gastosOperativos += this.toNumber(viaje.costoCombustible) + this.toNumber(viaje.otrosGastos);

      const porcentajeComision = this.toNumber(viaje.chofer?.porcentajeComision);
      bucket.gastosComisionChofer += (ingreso * porcentajeComision) / 100;

      if (viaje.choferId) {
        bucket.choferIds.add(viaje.choferId);
      }

      if (viaje.chofer?.id) {
        choferesById.set(viaje.chofer.id, viaje.chofer);
      }
    }

    const missingChoferIds = Array.from(buckets.values())
      .flatMap((bucket) => Array.from(bucket.choferIds))
      .filter((id) => !choferesById.has(id));

    if (missingChoferIds.length > 0) {
      const choferes = await this.choferRepository.find({ where: { id: In(missingChoferIds) } });
      for (const chofer of choferes) {
        choferesById.set(chofer.id, chofer);
      }
    }

    const mantenimientoByCamion = new Map<number, number>();
    if (filters.compararPor === 'camion') {
      const camionIds = Array.from(buckets.values()).map((bucket) => bucket.id);
      if (camionIds.length > 0) {
        const mantenimientos = await this.mantenimientoRepository.find({
          where: { camionId: In(camionIds) },
        });

        for (const mantenimiento of mantenimientos) {
          const fechaBase = mantenimiento.fechaRealizado || mantenimiento.fechaPrograma;
          if (!fechaBase) {
            continue;
          }

          const fecha = new Date(fechaBase);
          if (fecha < desde || fecha > hasta) {
            continue;
          }

          const costo = this.toNumber(mantenimiento.costoReal);
          if (costo <= 0) {
            continue;
          }

          const current = mantenimientoByCamion.get(mantenimiento.camionId) || 0;
          mantenimientoByCamion.set(mantenimiento.camionId, current + costo);
        }
      }
    }

    const comparativas = Array.from(buckets.values())
      .map((bucket) => {
        let gastosSueldo = 0;
        for (const choferId of bucket.choferIds) {
          gastosSueldo += this.toNumber(choferesById.get(choferId)?.sueldoBase);
        }

        const gastosMantenimiento = filters.compararPor === 'camion'
          ? this.toNumber(mantenimientoByCamion.get(bucket.id))
          : 0;
        const gastos = bucket.gastosOperativos + bucket.gastosComisionChofer + gastosSueldo + gastosMantenimiento;

        return {
          id: bucket.id,
          label: bucket.label,
          ingresos: this.round2(bucket.ingresos),
          gastos: this.round2(gastos),
          gananciaNeta: this.round2(bucket.ingresos - gastos),
        };
      })
      .sort((a, b) => b.gananciaNeta - a.gananciaNeta);

    if (filters.compararPor === 'camion') {
      const missingCamionLabelIds = comparativas
        .filter((item) => item.label === `Camión #${item.id}`)
        .map((item) => item.id);

      if (missingCamionLabelIds.length > 0) {
        const camiones = await this.camionRepository.find({
          where: { id: In(missingCamionLabelIds) },
        });

        const camionLabelById = new Map<number, string>();
        for (const camion of camiones) {
          camionLabelById.set(
            camion.id,
            camion.patente
              ? `${camion.patente}${camion.marca ? ` - ${camion.marca}` : ''}`
              : `Camión #${camion.id}`,
          );
        }

        for (const item of comparativas) {
          const enrichedLabel = camionLabelById.get(item.id);
          if (enrichedLabel) {
            item.label = enrichedLabel;
          }
        }
      }
    } else {
      const choferLabelById = new Map<number, string>();
      for (const chofer of choferesById.values()) {
        const fullName = `${chofer.nombre || ''} ${chofer.apellido || ''}`.trim();
        choferLabelById.set(chofer.id, fullName || `Chofer #${chofer.id}`);
      }

      for (const item of comparativas) {
        const enrichedLabel = choferLabelById.get(item.id);
        if (enrichedLabel) {
          item.label = enrichedLabel;
        }
      }
    }

    return {
      filtrosAplicados: {
        compararPor: filters.compararPor,
        camionIds: filters.camionIds,
        choferIds: filters.choferIds,
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
      },
      comparativas,
    };
  }

  async getOperacionCamion(filters: {
    camionId: number;
    granularidad: GranularidadOperacion;
    desde?: Date;
    hasta?: Date;
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    const viajes = await this.viajeRepository.find({
      where: {
        camionId: filters.camionId,
        fechaInicio: Between(desde, hasta),
      },
      order: { fechaInicio: 'ASC' },
    });

    const buckets = new Map<string, OperacionBucket>();
    for (const viaje of viajes) {
      const key = this.toOperacionBucketKey(viaje.fechaInicio, filters.granularidad);
      if (!buckets.has(key)) {
        buckets.set(key, { kms: 0, toneladas: 0 });
      }

      const bucket = buckets.get(key)!;
      bucket.kms += this.toNumber(viaje.kmRecorridos);
      bucket.toneladas += this.toNumber(viaje.pesoCargaKg) / 1000;
    }

    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => ({
        periodo: key,
        etiqueta: this.formatOperacionLabel(key, filters.granularidad),
        kms: this.round2(bucket.kms),
        toneladas: this.round2(bucket.toneladas),
      }));

    return {
      filtrosAplicados: {
        camionId: filters.camionId,
        granularidad: filters.granularidad,
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
      },
      resumen: {
        totalKms: this.round2(series.reduce((acc, item) => acc + item.kms, 0)),
        totalToneladas: this.round2(series.reduce((acc, item) => acc + item.toneladas, 0)),
      },
      series,
    };
  }

  private async getViajes(filters: RentabilidadFilters): Promise<Viaje[]> {
    const where: any = {
      fechaInicio: Between(filters.desde, filters.hasta),
    };

    if (filters.camionIds && filters.camionIds.length > 0) {
      where.camionId = In(filters.camionIds);
    }

    if (filters.choferIds && filters.choferIds.length > 0) {
      where.choferId = In(filters.choferIds);
    }

    return this.viajeRepository.find({
      where,
      order: { fechaInicio: 'ASC' },
      relations: ['chofer', 'camion'],
    });
  }

  private async addMantenimientoToBuckets(
    buckets: Map<string, BucketAccumulator>,
    filters: RentabilidadFilters,
  ) {
    const hasChoferFilter = Boolean(filters.choferIds && filters.choferIds.length > 0);
    const hasCamionFilter = Boolean(filters.camionIds && filters.camionIds.length > 0);
    const includeMantenimiento = !hasChoferFilter || hasCamionFilter;
    if (!includeMantenimiento) {
      return;
    }

    const where: any = {};
    if (hasCamionFilter) {
      where.camionId = In(filters.camionIds!);
    }

    const mantenimientos = await this.mantenimientoRepository.find({ where });

    for (const mantenimiento of mantenimientos) {
      const fechaBase = mantenimiento.fechaRealizado || mantenimiento.fechaPrograma;
      if (!fechaBase) {
        continue;
      }

      const fecha = new Date(fechaBase);
      if (fecha < filters.desde || fecha > filters.hasta) {
        continue;
      }

      const costo = this.toNumber(mantenimiento.costoReal);
      if (costo <= 0) {
        continue;
      }

      const key = this.toBucketKey(fecha, filters.granularidad);
      const bucket = this.ensureBucket(buckets, key);
      bucket.gastosMantenimiento += costo;
    }
  }

  private async addSueldoToBuckets(
    buckets: Map<string, BucketAccumulator>,
    choferesById: Map<number, Chofer>,
    granularidad: Granularidad,
  ) {
    const missingChoferIds = Array.from(buckets.values())
      .flatMap((bucket) => Array.from(bucket.choferIds))
      .filter((choferId) => !choferesById.has(choferId));

    if (missingChoferIds.length > 0) {
      const choferes = await this.choferRepository.find({
        where: { id: In(missingChoferIds) },
      });
      for (const chofer of choferes) {
        choferesById.set(chofer.id, chofer);
      }
    }

    for (const [key, bucket] of buckets.entries()) {
      for (const choferId of bucket.choferIds) {
        const chofer = choferesById.get(choferId);
        if (!chofer) {
          continue;
        }

        const sueldoBase = this.toNumber(chofer.sueldoBase);
        if (sueldoBase <= 0) {
          continue;
        }

        if (granularidad === 'mensual') {
          bucket.gastosSueldoChofer += sueldoBase;
        } else {
          const [year, month] = key.split('-').map((v) => Number(v));
          const daysInMonth = new Date(year, month, 0).getDate();
          bucket.gastosSueldoChofer += sueldoBase / daysInMonth;
        }
      }
    }
  }

  private toBucketKey(date: Date, granularidad: Granularidad): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');

    if (granularidad === 'mensual') {
      return `${year}-${month}`;
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toOperacionBucketKey(date: Date, granularidad: GranularidadOperacion): string {
    if (granularidad === 'diaria') {
      return this.toBucketKey(date, 'diaria');
    }

    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return d.toISOString().split('T')[0];
  }

  private formatLabel(bucketKey: string, granularidad: Granularidad): string {
    if (granularidad === 'mensual') {
      const [year, month] = bucketKey.split('-');
      return `${month}/${year}`;
    }

    const [year, month, day] = bucketKey.split('-');
    return `${day}/${month}/${year}`;
  }

  private formatOperacionLabel(bucketKey: string, granularidad: GranularidadOperacion): string {
    if (granularidad === 'diaria') {
      return this.formatLabel(bucketKey, 'diaria');
    }

    const [year, month, day] = bucketKey.split('-');
    return `Sem ${day}/${month}/${year}`;
  }

  private ensureBucket(map: Map<string, BucketAccumulator>, key: string): BucketAccumulator {
    if (!map.has(key)) {
      map.set(key, {
        ingresos: 0,
        gastosOperativos: 0,
        gastosComisionChofer: 0,
        gastosSueldoChofer: 0,
        gastosMantenimiento: 0,
        kmRecorridos: 0,
        choferIds: new Set<number>(),
      });
    }

    return map.get(key)!;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // Reportes adicionales
  async getDesempenoChoferes(filters: {
    desde?: Date;
    hasta?: Date;
    choferIds?: number[];
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    const viajes = await this.viajeRepository.find({
      relations: ['chofer'],
      where: {
        fechaInicio: Between(desde, hasta),
        choferId: filters.choferIds && filters.choferIds.length > 0 ? In(filters.choferIds) : undefined,
      },
      order: { fechaInicio: 'ASC' },
    });

    const choferesMap = new Map<number, {
      id: number;
      nombre: string;
      viajesCompletos: number;
      ingresos: number;
      comisiones: number;
    }>();

    for (const viaje of viajes) {
      const choferId = viaje.choferId;
      if (!choferesMap.has(choferId)) {
        choferesMap.set(choferId, {
          id: choferId,
          nombre: `${viaje.chofer?.nombre || ''} ${viaje.chofer?.apellido || ''}`.trim(),
          viajesCompletos: 0,
          ingresos: 0,
          comisiones: 0,
        });
      }

      const chofer = choferesMap.get(choferId)!;
      chofer.viajesCompletos += 1;
      chofer.ingresos += this.toNumber(viaje.valorViaje);
      const porcentajeComision = this.toNumber(viaje.chofer?.porcentajeComision || 0);
      chofer.comisiones += (this.toNumber(viaje.valorViaje) * porcentajeComision) / 100;
    }

    const desempenio = Array.from(choferesMap.values())
      .map((chofer) => ({
        ...chofer,
        ingresos: this.round2(chofer.ingresos),
        comisiones: this.round2(chofer.comisiones),
        comisionPromedio: chofer.viajesCompletos > 0 ? this.round2(chofer.comisiones / chofer.viajesCompletos) : 0,
      }))
      .sort((a, b) => b.viajesCompletos - a.viajesCompletos);

    return {
      filtrosAplicados: {
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
        choferIds: filters.choferIds,
      },
      desempenio,
    };
  }

  async getGastosMantenimiento(filters: {
    desde?: Date;
    hasta?: Date;
    camionIds?: number[];
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    const mantenimientos = await this.mantenimientoRepository.find({
      relations: ['camion', 'tipo'],
      where: {
        costoReal: filters.camionIds && filters.camionIds.length > 0 ? In(filters.camionIds) : undefined,
      },
    });

    const gastosPorCamion = new Map<number, {
      camionId: number;
      patente: string;
      tipoMantenimiento: string;
      fecha: Date;
      costo: number;
      estado: string;
    }[]>();

    for (const mantenimiento of mantenimientos) {
      const fecha = mantenimiento.fechaRealizado || mantenimiento.fechaPrograma;
      if (!fecha || fecha < desde || fecha > hasta) {
        continue;
      }

      const costo = this.toNumber(mantenimiento.costoReal);
      if (costo <= 0) {
        continue;
      }

      const camionId = mantenimiento.camionId;
      if (!gastosPorCamion.has(camionId)) {
        gastosPorCamion.set(camionId, []);
      }

      gastosPorCamion.get(camionId)!.push({
        camionId,
        patente: mantenimiento.camion?.patente || '',
        tipoMantenimiento: mantenimiento.tipo?.nombre || 'Sin especificar',
        fecha,
        costo: this.round2(costo),
        estado: mantenimiento.estado,
      });
    }

    const gastos = Array.from(gastosPorCamion.entries())
      .map(([camionId, registros]) => ({
        camionId,
        patente: registros[0]?.patente || '',
        registros,
        totalGastos: this.round2(registros.reduce((sum, r) => sum + r.costo, 0)),
        cantidadRegistros: registros.length,
      }))
      .sort((a, b) => b.totalGastos - a.totalGastos);

    const resumenTotal = this.round2(gastos.reduce((sum, g) => sum + g.totalGastos, 0));

    return {
      filtrosAplicados: {
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
        camionIds: filters.camionIds,
      },
      resumenTotal,
      gastos,
    };
  }

  async getIngresosMS(filters: {
    desde?: Date;
    hasta?: Date;
    camionIds?: number[];
    choferIds?: number[];
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getFullYear(), hasta.getMonth(), 1);

    const viajes = await this.getViajes({
      granularidad: 'mensual',
      desde,
      hasta,
      camionIds: filters.camionIds,
      choferIds: filters.choferIds,
    });

    const ingresosPorMes = new Map<string, {
      mes: string;
      viajesCompletos: number;
      ingresos: number;
      gastos: number;
      gananciaNeta: number;
    }>();

    for (const viaje of viajes) {
      const mesKey = this.toBucketKey(viaje.fechaInicio, 'mensual');
      if (!ingresosPorMes.has(mesKey)) {
        ingresosPorMes.set(mesKey, {
          mes: this.formatLabel(mesKey, 'mensual'),
          viajesCompletos: 0,
          ingresos: 0,
          gastos: 0,
          gananciaNeta: 0,
        });
      }

      const mes = ingresosPorMes.get(mesKey)!;
      mes.viajesCompletos += 1;
      const ingreso = this.toNumber(viaje.valorViaje);
      mes.ingresos += ingreso;

      // Gastos
      const gastoCombustible = this.toNumber(viaje.costoCombustible);
      const otrosGastos = this.toNumber(viaje.otrosGastos);
      const porcentajeComision = this.toNumber(viaje.chofer?.porcentajeComision);
      const gastoComision = (ingreso * porcentajeComision) / 100;

      mes.gastos += gastoCombustible + otrosGastos + gastoComision;
      mes.gananciaNeta = mes.ingresos - mes.gastos;
    }

    const ingresos = Array.from(ingresosPorMes.values())
      .map((mes) => ({
        ...mes,
        ingresos: this.round2(mes.ingresos),
        gastos: this.round2(mes.gastos),
        gananciaNeta: this.round2(mes.gananciaNeta),
        rentabilidad: mes.ingresos > 0 ? this.round2((mes.gananciaNeta / mes.ingresos) * 100) : 0,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    const resumen = {
      totalViajesCompletos: ingresos.reduce((sum, m) => sum + m.viajesCompletos, 0),
      totalIngresos: this.round2(ingresos.reduce((sum, m) => sum + m.ingresos, 0)),
      totalGastos: this.round2(ingresos.reduce((sum, m) => sum + m.gastos, 0)),
      totalGananciaNeta: this.round2(ingresos.reduce((sum, m) => sum + m.gananciaNeta, 0)),
    };

    return {
      filtrosAplicados: {
        desde: desde.toISOString().split('T')[0],
        hasta: hasta.toISOString().split('T')[0],
        camionIds: filters.camionIds,
        choferIds: filters.choferIds,
      },
      resumen,
      ingresos,
    };
  }
}
