import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { Chofer } from '../choferes/chofer.entity';

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
              ? `${viaje.camion?.patente || 'Camión'} ${viaje.camion?.marca ? `- ${viaje.camion.marca}` : ''}`.trim()
              : `${viaje.chofer?.nombre || 'Chofer'} ${viaje.chofer?.apellido || ''}`.trim(),
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
      relations: ['chofer'],
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
}
