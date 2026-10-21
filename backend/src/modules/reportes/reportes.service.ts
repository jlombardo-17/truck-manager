import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Camion } from '../camiones/camion.entity';
import { Servicio } from '../camiones/servicio.entity';
import { GastoFijo } from '../camiones/gasto-fijo.entity';
import { ChoferSalarioPago } from '../choferes/chofer-salario-pago.entity';
import { parseDateOnly, toDateOnly } from '../../common/utils/date-only';
import { getUsdUyuRateInfo } from '../../common/utils/usd-uyu-rate';

type Granularidad = 'diaria' | 'semanal' | 'mensual';
type GranularidadOperacion = 'diaria' | 'semanal' | 'mensual';

interface RentabilidadFilters {
  granularidad: Granularidad;
  camionIds?: number[];
  choferIds?: number[];
  desde: Date;
  hasta: Date;
  usarFechaPago?: boolean;
}

/**
 * Criterio de "Gastos" para todos los reportes:
 * - operativosViaje: combustible + otros gastos cargados en el viaje
 * - gastosViaje: comisiones/gastos listados en el viaje (no cancelados)
 * - sueldoChofer: sueldo base prorrateado de los choferes con viajes en el período
 * - mantenimiento: servicios del camión + registros de mantenimiento (por fecha, sin viaje)
 * - gastosFijos: gastos fijos anuales (seguro, patente, ...) prorrateados por día
 * Las repostadas no se suman: el combustible ya está cargado en cada viaje.
 */
interface BucketAccumulator {
  ingresos: number;
  cantidadViajes: number;
  gastosOperativos: number;
  gastosViaje: number;
  gastosSueldoChofer: number;
  gastosMantenimiento: number;
  gastosFijos: number;
  kmRecorridos: number;
  choferIds: Set<number>;
}

interface OperacionBucket {
  kms: number;
  toneladas: number;
}

interface CostoMantenimiento {
  id: number;
  camionId: number;
  patente: string;
  origen: 'servicio' | 'mantenimiento';
  concepto: string;
  fecha: string;
  costo: number;
  estado: string;
}

export interface CostosCamionPeriodo {
  mantenimiento: number;
  gastosFijos: number;
}

interface GastoFijoProrrateable {
  gastoFijo: GastoFijo;
  montoAnualUyu: number;
  vigenciaInicio: Date;
  vigenciaFin: Date | null;
}

export type CategoriaDetalleRentabilidad =
  | 'ingreso'
  | 'operativosViaje'
  | 'gastosViaje'
  | 'mantenimiento'
  | 'gastosFijos'
  | 'sueldoChofer';

/** Registro que compone un período de rentabilidad, con la referencia a su origen. */
export interface DetalleRentabilidadItem {
  categoria: CategoriaDetalleRentabilidad;
  fecha: string | null;
  concepto: string;
  patente: string | null;
  chofer: string | null;
  monto: number;
  referencia: {
    tipo: 'viaje' | 'servicio' | 'mantenimiento' | 'gastoFijo' | 'chofer';
    id: number;
    camionId?: number;
    viajeId?: number;
    choferId?: number;
  };
}

const DIAS_ANIO = 365;

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
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    @InjectRepository(GastoFijo)
    private readonly gastoFijoRepository: Repository<GastoFijo>,
    @InjectRepository(ChoferSalarioPago)
    private readonly salarioPagoRepository: Repository<ChoferSalarioPago>,
  ) {}

  async getFlujoCaja(filters: {
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

    const monthKeys = this.getMonthlyKeysInRange(desde, hasta);
    const flujoPorMes = new Map<
      string,
      {
        mes: string;
        ingresosViajes: number;
        egresosOperativosViaje: number;
        egresosGastosViaje: number;
        egresosMantenimiento: number;
        egresosPagosChoferes: number;
        egresosGastosFijos: number;
      }
    >();

    for (const key of monthKeys) {
      flujoPorMes.set(key, {
        mes: this.formatLabel(key, 'mensual'),
        ingresosViajes: 0,
        egresosOperativosViaje: 0,
        egresosGastosViaje: 0,
        egresosMantenimiento: 0,
        egresosPagosChoferes: 0,
        egresosGastosFijos: 0,
      });
    }

    const viajesCamionIds = new Set<number>();
    const viajesChoferIds = new Set<number>();

    for (const viaje of viajes) {
      const key = this.toBucketKey(viaje.fechaInicio, 'mensual');
      if (!flujoPorMes.has(key)) {
        continue;
      }

      const item = flujoPorMes.get(key)!;
      item.ingresosViajes += this.getIngresoViajeUyu(viaje);
      item.egresosOperativosViaje += this.getGastosOperativosViaje(viaje);
      item.egresosGastosViaje += this.getGastosCargadosViaje(viaje);

      if (viaje.camionId) viajesCamionIds.add(viaje.camionId);
      if (viaje.choferId) viajesChoferIds.add(viaje.choferId);
    }

    const effectiveCamionIds =
      filters.camionIds && filters.camionIds.length > 0
        ? filters.camionIds
        : filters.choferIds && filters.choferIds.length > 0
          ? Array.from(viajesCamionIds)
          : undefined;

    const effectiveChoferIds =
      filters.choferIds && filters.choferIds.length > 0
        ? filters.choferIds
        : filters.camionIds && filters.camionIds.length > 0
          ? Array.from(viajesChoferIds)
          : undefined;

    const hasEffectiveCamionFilter = effectiveCamionIds !== undefined;
    if (!hasEffectiveCamionFilter || effectiveCamionIds.length > 0) {
      const costosMantenimiento = await this.getCostosMantenimiento(desde, hasta, effectiveCamionIds);
      for (const costo of costosMantenimiento) {
        const key = this.toBucketKey(parseDateOnly(costo.fecha), 'mensual');
        const item = flujoPorMes.get(key);
        if (item) {
          item.egresosMantenimiento += costo.costo;
        }
      }

      const gastosFijos = await this.getGastosFijosProrrateables(effectiveCamionIds);
      for (const key of monthKeys) {
        const { start, end } = this.getBucketDateRange(key, 'mensual');
        const periodStart = new Date(Math.max(start.getTime(), desde.getTime()));
        const periodEnd = new Date(Math.min(end.getTime(), hasta.getTime()));
        if (periodStart > periodEnd) {
          continue;
        }

        flujoPorMes.get(key)!.egresosGastosFijos += this.sumGastosFijosForPeriod(gastosFijos, periodStart, periodEnd);
      }
    }

    const pagosQuery = this.salarioPagoRepository
      .createQueryBuilder('pago')
      .innerJoinAndSelect('pago.salario', 'salario')
      .where('pago.fecha_pago BETWEEN :desde AND :hasta', { desde, hasta });

    if (effectiveChoferIds && effectiveChoferIds.length > 0) {
      pagosQuery.andWhere('salario.chofer_id IN (:...choferIds)', {
        choferIds: effectiveChoferIds,
      });
    }

    const pagos = await pagosQuery.getMany();
    for (const pago of pagos) {
      const key = this.toBucketKey(parseDateOnly(pago.fechaPago), 'mensual');
      if (!flujoPorMes.has(key)) {
        continue;
      }

      const monto = this.toNumber(pago.monto);
      if (monto <= 0) {
        continue;
      }

      flujoPorMes.get(key)!.egresosPagosChoferes += monto;
    }

    const series = monthKeys
      .map((key) => {
        const item = flujoPorMes.get(key)!;
        const totalEgresos =
          item.egresosOperativosViaje +
          item.egresosGastosViaje +
          item.egresosMantenimiento +
          item.egresosPagosChoferes +
          item.egresosGastosFijos;

        return {
          mes: item.mes,
          ingresos: this.round2(item.ingresosViajes),
          egresos: this.round2(totalEgresos),
          resultadoNeto: this.round2(item.ingresosViajes - totalEgresos),
          detalleEgresos: {
            operativosViaje: this.round2(item.egresosOperativosViaje),
            gastosViaje: this.round2(item.egresosGastosViaje),
            mantenimiento: this.round2(item.egresosMantenimiento),
            pagosChoferes: this.round2(item.egresosPagosChoferes),
            gastosFijos: this.round2(item.egresosGastosFijos),
          },
        };
      })
      .filter((item) => item.ingresos > 0 || item.egresos > 0);

    const resumen = series.reduce(
      (acc, item) => {
        acc.totalIngresos += item.ingresos;
        acc.totalEgresos += item.egresos;
        acc.resultadoNeto += item.resultadoNeto;
        acc.detalleEgresos.operativosViaje += item.detalleEgresos.operativosViaje;
        acc.detalleEgresos.gastosViaje += item.detalleEgresos.gastosViaje;
        acc.detalleEgresos.mantenimiento += item.detalleEgresos.mantenimiento;
        acc.detalleEgresos.pagosChoferes += item.detalleEgresos.pagosChoferes;
        acc.detalleEgresos.gastosFijos += item.detalleEgresos.gastosFijos;
        return acc;
      },
      {
        totalIngresos: 0,
        totalEgresos: 0,
        resultadoNeto: 0,
        detalleEgresos: {
          operativosViaje: 0,
          gastosViaje: 0,
          mantenimiento: 0,
          pagosChoferes: 0,
          gastosFijos: 0,
        },
      },
    );

    return {
      filtrosAplicados: {
        desde: toDateOnly(desde),
        hasta: toDateOnly(hasta),
        camionIds: filters.camionIds,
        choferIds: filters.choferIds,
      },
      resumen: {
        totalIngresos: this.round2(resumen.totalIngresos),
        totalEgresos: this.round2(resumen.totalEgresos),
        resultadoNeto: this.round2(resumen.resultadoNeto),
        detalleEgresos: {
          operativosViaje: this.round2(resumen.detalleEgresos.operativosViaje),
          gastosViaje: this.round2(resumen.detalleEgresos.gastosViaje),
          mantenimiento: this.round2(resumen.detalleEgresos.mantenimiento),
          pagosChoferes: this.round2(resumen.detalleEgresos.pagosChoferes),
          gastosFijos: this.round2(resumen.detalleEgresos.gastosFijos),
        },
      },
      series,
    };
  }

  private getMonthlyKeysInRange(desde: Date, hasta: Date): string[] {
    const keys: string[] = [];
    const cursor = new Date(desde.getFullYear(), desde.getMonth(), 1);
    const end = new Date(hasta.getFullYear(), hasta.getMonth(), 1);

    while (cursor <= end) {
      keys.push(this.toBucketKey(cursor, 'mensual'));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return keys;
  }

  private getBucketKeysInRange(desde: Date, hasta: Date, granularidad: Granularidad): string[] {
    if (granularidad === 'mensual') {
      return this.getMonthlyKeysInRange(desde, hasta);
    }

    const keys = new Set<string>();
    const cursor = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    while (cursor <= hasta) {
      keys.add(this.toBucketKey(cursor, granularidad));
      cursor.setDate(cursor.getDate() + 1);
    }

    return Array.from(keys);
  }

  private resolveRentabilidadFilters(filters: Partial<RentabilidadFilters>): RentabilidadFilters {
    const granularidad: Granularidad = filters.granularidad || 'diaria';
    const hasta = filters.hasta || new Date();
    const desde =
      filters.desde ||
      (granularidad === 'diaria'
        ? new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000)
        : new Date(hasta.getFullYear(), hasta.getMonth() - 5, 1));

    return {
      granularidad,
      camionIds: filters.camionIds,
      choferIds: filters.choferIds,
      desde,
      hasta,
      usarFechaPago: filters.usarFechaPago,
    };
  }

  async getRentabilidad(filters: Partial<RentabilidadFilters>) {
    const parsedFilters = this.resolveRentabilidadFilters(filters);
    const { granularidad } = parsedFilters;

    const viajes = await this.getViajes(parsedFilters);
    const buckets = new Map<string, BucketAccumulator>();
    const choferesById = new Map<number, Chofer>();

    for (const viaje of viajes) {
      const key = this.toBucketKey(viaje.fechaInicio, granularidad);
      const bucket = this.ensureBucket(buckets, key);

      bucket.ingresos += this.getIngresoViajeUyu(viaje);
      bucket.cantidadViajes += 1;
      bucket.gastosOperativos += this.getGastosOperativosViaje(viaje);
      bucket.gastosViaje += this.getGastosCargadosViaje(viaje);
      bucket.kmRecorridos += this.toNumber(viaje.kmRecorridos);

      if (viaje.choferId) {
        bucket.choferIds.add(viaje.choferId);
      }

      if (viaje.chofer?.id) {
        choferesById.set(viaje.chofer.id, viaje.chofer);
      }
    }

    await this.addSueldoToBuckets(buckets, choferesById, granularidad);
    await this.addMantenimientoToBuckets(buckets, parsedFilters);
    await this.addGastosFijosToBuckets(buckets, parsedFilters);

    const series = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => {
        const gastosTotales =
          bucket.gastosOperativos +
          bucket.gastosViaje +
          bucket.gastosSueldoChofer +
          bucket.gastosMantenimiento +
          bucket.gastosFijos;
        const gananciaNeta = bucket.ingresos - gastosTotales;

        return {
          periodo: key,
          etiqueta: this.formatLabel(key, granularidad),
          ingresos: this.round2(bucket.ingresos),
          gastos: this.round2(gastosTotales),
          gananciaNeta: this.round2(gananciaNeta),
          kmRecorridos: this.round2(bucket.kmRecorridos),
          cantidadViajes: bucket.cantidadViajes,
          detalleGastos: {
            operativosViaje: this.round2(bucket.gastosOperativos),
            gastosViaje: this.round2(bucket.gastosViaje),
            sueldoChofer: this.round2(bucket.gastosSueldoChofer),
            mantenimiento: this.round2(bucket.gastosMantenimiento),
            gastosFijos: this.round2(bucket.gastosFijos),
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
        desde: toDateOnly(parsedFilters.desde),
        hasta: toDateOnly(parsedFilters.hasta),
        criterioFecha: parsedFilters.usarFechaPago ? 'fechaPago' : 'fechaInicio',
      },
      resumen: {
        totalIngresos: this.round2(resumen.totalIngresos),
        totalGastos: this.round2(resumen.totalGastos),
        totalGananciaNeta: this.round2(resumen.totalGananciaNeta),
      },
      series,
    };
  }

  /**
   * Desglose de un período de getRentabilidad: cada viaje, comisión, mantenimiento, gasto fijo
   * y sueldo que suma en ese período. Usa los mismos criterios, así los totales coinciden.
   */
  async getRentabilidadDetalle(filters: Partial<RentabilidadFilters>, periodo: string) {
    const parsedFilters = this.resolveRentabilidadFilters(filters);
    const { granularidad } = parsedFilters;
    const items: DetalleRentabilidadItem[] = [];
    const nombreChofer = (chofer?: Chofer | null) =>
      chofer ? `${chofer.nombre || ''} ${chofer.apellido || ''}`.trim() : null;

    const viajes = (await this.getViajes(parsedFilters)).filter(
      (viaje) => this.toBucketKey(viaje.fechaInicio, granularidad) === periodo,
    );
    const choferesById = new Map<number, Chofer>();

    for (const viaje of viajes) {
      const base = {
        fecha: viaje.fechaInicio ? toDateOnly(viaje.fechaInicio) : null,
        patente: viaje.camion?.patente || null,
        chofer: nombreChofer(viaje.chofer),
      };
      const referencia = {
        tipo: 'viaje' as const,
        id: viaje.id,
        viajeId: viaje.id,
        camionId: viaje.camionId,
        choferId: viaje.choferId,
      };
      const ruta = [viaje.origen, viaje.destino].filter(Boolean).join(' → ');
      const nombreViaje = `Viaje ${viaje.numeroViaje || `#${viaje.id}`}${ruta ? ` (${ruta})` : ''}`;

      const ingreso = this.getIngresoViajeUyu(viaje);
      if (ingreso !== 0) {
        items.push({ ...base, categoria: 'ingreso', concepto: nombreViaje, monto: this.round2(ingreso), referencia });
      }

      const combustible = this.toNumber(viaje.costoCombustible);
      if (combustible !== 0) {
        items.push({
          ...base,
          categoria: 'operativosViaje',
          concepto: `Combustible · ${nombreViaje}`,
          monto: this.round2(combustible),
          referencia,
        });
      }

      const otrosGastos = this.toNumber(viaje.otrosGastos);
      if (otrosGastos !== 0) {
        items.push({
          ...base,
          categoria: 'operativosViaje',
          concepto: `Otros gastos · ${nombreViaje}`,
          monto: this.round2(otrosGastos),
          referencia,
        });
      }

      for (const comision of viaje.comisiones || []) {
        const monto = this.toNumber(comision.montoTotal);
        if (comision.estado === 'cancelado' || monto === 0) {
          continue;
        }

        const concepto = [comision.concepto || comision.tipo, comision.beneficiario].filter(Boolean).join(' · ');
        items.push({
          ...base,
          categoria: 'gastosViaje',
          concepto: `${concepto || 'Gasto'} · ${nombreViaje}`,
          monto: this.round2(monto),
          referencia,
        });
      }

      if (viaje.chofer?.id) {
        choferesById.set(viaje.chofer.id, viaje.chofer);
      }
    }

    const missingChoferIds = [
      ...new Set(viajes.map((viaje) => viaje.choferId).filter((id): id is number => Boolean(id))),
    ].filter((id) => !choferesById.has(id));
    if (missingChoferIds.length > 0) {
      for (const chofer of await this.choferRepository.find({ where: { id: In(missingChoferIds) } })) {
        choferesById.set(chofer.id, chofer);
      }
    }

    for (const chofer of choferesById.values()) {
      const sueldoBase = this.toNumber(chofer.sueldoBase);
      if (sueldoBase <= 0) {
        continue;
      }

      items.push({
        categoria: 'sueldoChofer',
        fecha: null,
        concepto: granularidad === 'mensual' ? 'Sueldo base' : 'Sueldo base (prorrateo diario)',
        patente: null,
        chofer: nombreChofer(chofer),
        monto: this.round2(this.getSueldoChoferForBucket(sueldoBase, periodo, granularidad)),
        referencia: { tipo: 'chofer', id: chofer.id, choferId: chofer.id },
      });
    }

    if (this.includeCostosCamion(parsedFilters)) {
      const costos = await this.getCostosMantenimiento(parsedFilters.desde, parsedFilters.hasta, parsedFilters.camionIds);
      for (const costo of costos) {
        if (this.toBucketKey(parseDateOnly(costo.fecha), granularidad) !== periodo) {
          continue;
        }

        items.push({
          categoria: 'mantenimiento',
          fecha: costo.fecha,
          concepto: `${costo.origen === 'servicio' ? 'Servicio' : 'Mantenimiento'}: ${costo.concepto}`,
          patente: costo.patente || null,
          chofer: null,
          monto: costo.costo,
          referencia: { tipo: costo.origen, id: costo.id, camionId: costo.camionId },
        });
      }

      const { start, end } = this.getBucketDateRange(periodo, granularidad);
      const periodStart = new Date(Math.max(start.getTime(), parsedFilters.desde.getTime()));
      const periodEnd = new Date(Math.min(end.getTime(), parsedFilters.hasta.getTime()));
      if (periodStart <= periodEnd) {
        for (const item of await this.getGastosFijosProrrateables(parsedFilters.camionIds)) {
          const costo = this.getGastoFijoCostForPeriod(item, periodStart, periodEnd);
          if (costo <= 0) {
            continue;
          }

          const { gastoFijo } = item;
          const dias = this.getOverlapDays(item.vigenciaInicio, item.vigenciaFin ?? periodEnd, periodStart, periodEnd);
          items.push({
            categoria: 'gastosFijos',
            fecha: null,
            concepto: `${gastoFijo.concepto || gastoFijo.tipo} (prorrateo ${dias} día${dias === 1 ? '' : 's'})`,
            patente: gastoFijo.camion?.patente || null,
            chofer: null,
            monto: this.round2(costo),
            referencia: { tipo: 'gastoFijo', id: gastoFijo.id, camionId: gastoFijo.camionId },
          });
        }
      }
    }

    return {
      periodo,
      etiqueta: this.formatLabel(periodo, granularidad),
      granularidad,
      items,
    };
  }

  async getRentabilidadComparativa(filters: {
    compararPor: 'camion' | 'chofer';
    desde?: Date;
    hasta?: Date;
    camionIds?: number[];
    choferIds?: number[];
    usarFechaPago?: boolean;
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    const viajes = await this.getViajes({
      granularidad: 'diaria',
      desde,
      hasta,
      camionIds: filters.camionIds,
      choferIds: filters.choferIds,
      usarFechaPago: filters.usarFechaPago,
    });

    const buckets = new Map<string, {
      id: number;
      label: string;
      ingresos: number;
      gastosOperativos: number;
      gastosViaje: number;
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
          gastosViaje: 0,
          choferIds: new Set<number>(),
        });
      }

      const bucket = buckets.get(key)!;
      bucket.ingresos += this.getIngresoViajeUyu(viaje);
      bucket.gastosOperativos += this.getGastosOperativosViaje(viaje);
      bucket.gastosViaje += this.getGastosCargadosViaje(viaje);

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

    const camionIds = Array.from(buckets.values()).map((bucket) => bucket.id);
    const costosCamion = filters.compararPor === 'camion' && camionIds.length > 0
      ? await this.getCostosCamionPorPeriodo(desde, hasta, camionIds)
      : new Map<number, CostosCamionPeriodo>();

    const comparativas = Array.from(buckets.values())
      .map((bucket) => {
        let gastosSueldo = 0;
        for (const choferId of bucket.choferIds) {
          gastosSueldo += this.toNumber(choferesById.get(choferId)?.sueldoBase);
        }

        const gastosMantenimiento = this.toNumber(costosCamion.get(bucket.id)?.mantenimiento);
        const gastosFijos = this.toNumber(costosCamion.get(bucket.id)?.gastosFijos);
        const gastos = bucket.gastosOperativos + bucket.gastosViaje + gastosSueldo + gastosMantenimiento + gastosFijos;

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
        desde: toDateOnly(desde),
        hasta: toDateOnly(hasta),
        criterioFecha: filters.usarFechaPago ? 'fechaPago' : 'fechaInicio',
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

    const viajes = await this.viajeRepository
      .createQueryBuilder('viaje')
      .where('viaje.camion_id = :camionId', { camionId: filters.camionId })
      .andWhere('viaje.fechaInicio BETWEEN :desde AND :hasta', { desde, hasta })
      .orderBy('viaje.fechaInicio', 'ASC')
      .getMany();

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
        desde: toDateOnly(desde),
        hasta: toDateOnly(hasta),
      },
      resumen: {
        totalKms: this.round2(series.reduce((acc, item) => acc + item.kms, 0)),
        totalToneladas: this.round2(series.reduce((acc, item) => acc + item.toneladas, 0)),
      },
      series,
    };
  }

  private async getViajes(filters: RentabilidadFilters): Promise<Viaje[]> {
    const dateField = filters.usarFechaPago ? 'viaje.fechaPago' : 'viaje.fechaInicio';
    const query = this.viajeRepository
      .createQueryBuilder('viaje')
      .leftJoinAndSelect('viaje.chofer', 'chofer')
      .leftJoinAndSelect('viaje.camion', 'camion')
      .leftJoinAndSelect('viaje.comisiones', 'comisiones')
      .where(`${dateField} BETWEEN :desde AND :hasta`, {
        desde: filters.desde,
        hasta: filters.hasta,
      })
      .orderBy(dateField, 'ASC');

    if (filters.camionIds && filters.camionIds.length > 0) {
      query.andWhere('viaje.camion_id IN (:...camionIds)', {
        camionIds: filters.camionIds,
      });
    }

    if (filters.choferIds && filters.choferIds.length > 0) {
      query.andWhere('viaje.chofer_id IN (:...choferIds)', {
        choferIds: filters.choferIds,
      });
    }

    return query.getMany();
  }

  /** Combustible + otros gastos cargados en el viaje (ya en UYU). */
  private getGastosOperativosViaje(viaje: Viaje): number {
    return this.toNumber(viaje.costoCombustible) + this.toNumber(viaje.otrosGastos);
  }

  /** Comisiones y gastos listados en el viaje (ya normalizados a UYU al guardar). */
  private getGastosCargadosViaje(viaje: Viaje): number {
    return (viaje.comisiones || [])
      .filter((comision) => comision.estado !== 'cancelado')
      .reduce((sum, comision) => sum + this.toNumber(comision.montoTotal), 0);
  }

  /** Mantenimiento y gastos fijos son del camión: con filtro solo por chofer no se imputan. */
  private includeCostosCamion(filters: RentabilidadFilters): boolean {
    const hasChoferFilter = Boolean(filters.choferIds && filters.choferIds.length > 0);
    const hasCamionFilter = Boolean(filters.camionIds && filters.camionIds.length > 0);
    return !hasChoferFilter || hasCamionFilter;
  }

  private async addMantenimientoToBuckets(
    buckets: Map<string, BucketAccumulator>,
    filters: RentabilidadFilters,
  ) {
    if (!this.includeCostosCamion(filters)) {
      return;
    }

    const costos = await this.getCostosMantenimiento(filters.desde, filters.hasta, filters.camionIds);
    for (const costo of costos) {
      const key = this.toBucketKey(parseDateOnly(costo.fecha), filters.granularidad);
      const bucket = this.ensureBucket(buckets, key);
      bucket.gastosMantenimiento += costo.costo;
    }
  }

  private async addGastosFijosToBuckets(
    buckets: Map<string, BucketAccumulator>,
    filters: RentabilidadFilters,
  ) {
    if (!this.includeCostosCamion(filters)) {
      return;
    }

    const gastosFijos = await this.getGastosFijosProrrateables(filters.camionIds);
    if (gastosFijos.length === 0) {
      return;
    }

    // Los gastos fijos corren todos los días, haya o no viajes: se imputan a cada período del rango
    for (const key of this.getBucketKeysInRange(filters.desde, filters.hasta, filters.granularidad)) {
      const { start, end } = this.getBucketDateRange(key, filters.granularidad);
      const periodStart = new Date(Math.max(start.getTime(), filters.desde.getTime()));
      const periodEnd = new Date(Math.min(end.getTime(), filters.hasta.getTime()));
      if (periodStart > periodEnd) {
        continue;
      }

      const costo = this.sumGastosFijosForPeriod(gastosFijos, periodStart, periodEnd);
      if (costo <= 0) {
        continue;
      }

      this.ensureBucket(buckets, key).gastosFijos += costo;
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

        bucket.gastosSueldoChofer += this.getSueldoChoferForBucket(sueldoBase, key, granularidad);
      }
    }
  }

  /** Mensual: sueldo completo. Diaria/semanal: sueldo / días del mes, por período con viajes. */
  private getSueldoChoferForBucket(sueldoBase: number, key: string, granularidad: Granularidad): number {
    if (granularidad === 'mensual') {
      return sueldoBase;
    }

    const [year, month] = key.split('-').map((v) => Number(v));
    const daysInMonth = new Date(year, month, 0).getDate();
    return sueldoBase / daysInMonth;
  }

  /**
   * Costos del camión que no dependen de un viaje (mantenimiento + gastos fijos prorrateados),
   * agrupados por camión. Sin camionIds incluye todos los camiones. Lo usa también el dashboard.
   */
  async getCostosCamionPorPeriodo(
    desde: Date,
    hasta: Date,
    camionIds?: number[],
  ): Promise<Map<number, CostosCamionPeriodo>> {
    const [costosMantenimiento, gastosFijos] = await Promise.all([
      this.getCostosMantenimiento(desde, hasta, camionIds),
      this.getGastosFijosProrrateables(camionIds),
    ]);

    const porCamion = new Map<number, CostosCamionPeriodo>();
    const ensure = (camionId: number) => {
      if (!porCamion.has(camionId)) {
        porCamion.set(camionId, { mantenimiento: 0, gastosFijos: 0 });
      }
      return porCamion.get(camionId)!;
    };

    for (const costo of costosMantenimiento) {
      ensure(costo.camionId).mantenimiento += costo.costo;
    }

    for (const item of gastosFijos) {
      const costo = this.getGastoFijoCostForPeriod(item, desde, hasta);
      if (costo > 0) {
        ensure(item.gastoFijo.camionId).gastosFijos += costo;
      }
    }

    return porCamion;
  }

  /**
   * Costos de mantenimiento del camión en el rango: servicios (convertidos a UYU)
   * + registros de mantenimiento. No están asociados a un viaje.
   */
  private async getCostosMantenimiento(
    desde: Date,
    hasta: Date,
    camionIds?: number[],
  ): Promise<CostoMantenimiento[]> {
    const where: any = {};
    if (camionIds && camionIds.length > 0) {
      where.camionId = In(camionIds);
    }

    const [servicios, mantenimientos] = await Promise.all([
      this.servicioRepository.find({ where, relations: ['camion'] }),
      this.mantenimientoRepository.find({ where, relations: ['camion', 'tipo'] }),
    ]);

    const isInRange = (fecha?: string | null): fecha is string => {
      if (!fecha) return false;
      const parsed = parseDateOnly(fecha);
      return parsed >= desde && parsed <= hasta;
    };

    const serviciosEnRango = servicios.filter(
      (servicio) => isInRange(servicio.fechaServicio) && this.toNumber(servicio.costo) > 0,
    );
    const usdUyuRate = serviciosEnRango.some((servicio) => servicio.moneda === 'USD')
      ? (await getUsdUyuRateInfo()).rate
      : 1;

    const costos: CostoMantenimiento[] = serviciosEnRango.map((servicio) => {
      const costo = this.toNumber(servicio.costo);
      return {
        id: servicio.id,
        camionId: servicio.camionId,
        patente: servicio.camion?.patente || '',
        origen: 'servicio',
        concepto: servicio.descripcion || (servicio.tipos || []).join(', ') || 'Servicio',
        fecha: servicio.fechaServicio,
        costo: this.round2(servicio.moneda === 'USD' ? costo * usdUyuRate : costo),
        estado: 'realizado',
      };
    });

    for (const mantenimiento of mantenimientos) {
      const fecha = mantenimiento.fechaRealizado || mantenimiento.fechaPrograma;
      const costo = this.toNumber(mantenimiento.costoReal);
      if (!isInRange(fecha) || costo <= 0) {
        continue;
      }

      costos.push({
        id: mantenimiento.id,
        camionId: mantenimiento.camionId,
        patente: mantenimiento.camion?.patente || '',
        origen: 'mantenimiento',
        concepto: mantenimiento.tipo?.nombre || 'Sin especificar',
        fecha,
        costo: this.round2(costo),
        estado: mantenimiento.estado,
      });
    }

    return costos;
  }

  private async getGastosFijosProrrateables(camionIds?: number[]): Promise<GastoFijoProrrateable[]> {
    const where: any = {};
    if (camionIds && camionIds.length > 0) {
      where.camionId = In(camionIds);
    }

    const gastosFijos = (await this.gastoFijoRepository.find({ where, relations: ['camion'] }))
      .filter((gastoFijo) => this.toNumber(gastoFijo.montoAnual) > 0 && gastoFijo.vigenciaDesde);
    const usdUyuRate = gastosFijos.some((gastoFijo) => gastoFijo.moneda === 'USD')
      ? (await getUsdUyuRateInfo()).rate
      : 1;

    return gastosFijos.map((gastoFijo) => {
      const vigenciaFin = gastoFijo.vigenciaHasta ? parseDateOnly(gastoFijo.vigenciaHasta) : null;
      vigenciaFin?.setHours(23, 59, 59, 999);
      const montoAnual = this.toNumber(gastoFijo.montoAnual);

      return {
        gastoFijo,
        montoAnualUyu: gastoFijo.moneda === 'USD' ? montoAnual * usdUyuRate : montoAnual,
        vigenciaInicio: parseDateOnly(gastoFijo.vigenciaDesde),
        vigenciaFin,
      };
    });
  }

  /** Prorrateo diario del monto anual por los días de vigencia que caen en el período. */
  private getGastoFijoCostForPeriod(item: GastoFijoProrrateable, periodStart: Date, periodEnd: Date): number {
    const vigenciaFin = item.vigenciaFin ?? periodEnd;
    const overlapDays = this.getOverlapDays(item.vigenciaInicio, vigenciaFin, periodStart, periodEnd);
    if (overlapDays <= 0) {
      return 0;
    }

    return (item.montoAnualUyu / DIAS_ANIO) * overlapDays;
  }

  private sumGastosFijosForPeriod(gastosFijos: GastoFijoProrrateable[], periodStart: Date, periodEnd: Date): number {
    return gastosFijos.reduce((sum, item) => sum + this.getGastoFijoCostForPeriod(item, periodStart, periodEnd), 0);
  }

  private getWeekStartKey(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return d.toISOString().split('T')[0];
  }

  private toBucketKey(date: Date, granularidad: Granularidad): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');

    if (granularidad === 'mensual') {
      return `${year}-${month}`;
    }

    if (granularidad === 'semanal') {
      return this.getWeekStartKey(date);
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toOperacionBucketKey(date: Date, granularidad: GranularidadOperacion): string {
    if (granularidad === 'diaria') {
      return this.toBucketKey(date, 'diaria');
    }

    if (granularidad === 'mensual') {
      return this.toBucketKey(date, 'mensual');
    }

    return this.getWeekStartKey(date);
  }

  private formatLabel(bucketKey: string, granularidad: Granularidad): string {
    if (granularidad === 'mensual') {
      const [year, month] = bucketKey.split('-');
      return `${month}/${year}`;
    }

    if (granularidad === 'semanal') {
      const [year, month, day] = bucketKey.split('-');
      return `Sem ${day}/${month}/${year}`;
    }

    const [year, month, day] = bucketKey.split('-');
    return `${day}/${month}/${year}`;
  }

  private formatOperacionLabel(bucketKey: string, granularidad: GranularidadOperacion): string {
    if (granularidad === 'diaria') {
      return this.formatLabel(bucketKey, 'diaria');
    }

    if (granularidad === 'mensual') {
      return this.formatLabel(bucketKey, 'mensual');
    }

    const [year, month, day] = bucketKey.split('-');
    return `Sem ${day}/${month}/${year}`;
  }

  private ensureBucket(map: Map<string, BucketAccumulator>, key: string): BucketAccumulator {
    if (!map.has(key)) {
      map.set(key, {
        ingresos: 0,
        cantidadViajes: 0,
        gastosOperativos: 0,
        gastosViaje: 0,
        gastosSueldoChofer: 0,
        gastosMantenimiento: 0,
        gastosFijos: 0,
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

  private getIngresoViajeUyu(viaje: Viaje | Record<string, unknown>): number {
    const record = viaje as Record<string, unknown>;
    const ingresoUyu = this.toNumber(record.valorViajeUyu ?? record.valor_viaje_uyu);
    if (ingresoUyu > 0) {
      return ingresoUyu;
    }

    return this.toNumber(record.valorViaje ?? record.valor_viaje);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private getDaysInclusive(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  private getBucketDateRange(key: string, granularidad: Granularidad): { start: Date; end: Date } {
    if (granularidad === 'mensual') {
      const [year, month] = key.split('-').map((v) => Number(v));
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const [year, month, day] = key.split('-').map((v) => Number(v));
    const start = new Date(year, month - 1, day);
    if (granularidad === 'semanal') {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getOverlapDays(periodStart: Date, periodEnd: Date, filterStart: Date, filterEnd: Date): number {
    const start = new Date(Math.max(periodStart.getTime(), filterStart.getTime()));
    const end = new Date(Math.min(periodEnd.getTime(), filterEnd.getTime()));
    if (start > end) {
      return 0;
    }

    return this.getDaysInclusive(start, end);
  }

  // Reportes adicionales
  async getDesempenoChoferes(filters: {
    desde?: Date;
    hasta?: Date;
    choferIds?: number[];
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    const query = this.viajeRepository
      .createQueryBuilder('viaje')
      .leftJoinAndSelect('viaje.chofer', 'chofer')
      .where('viaje.fechaInicio BETWEEN :desde AND :hasta', { desde, hasta })
      .orderBy('viaje.fechaInicio', 'ASC');

    if (filters.choferIds && filters.choferIds.length > 0) {
      query.andWhere('viaje.chofer_id IN (:...choferIds)', {
        choferIds: filters.choferIds,
      });
    }

    const viajes = await query.getMany();

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
      chofer.ingresos += this.getIngresoViajeUyu(viaje);
      const porcentajeComision = this.toNumber(viaje.chofer?.porcentajeComision || 0);
      chofer.comisiones += (this.getIngresoViajeUyu(viaje) * porcentajeComision) / 100;
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
        desde: toDateOnly(desde),
        hasta: toDateOnly(hasta),
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

    const costos = await this.getCostosMantenimiento(desde, hasta, filters.camionIds);
    const gastosPorCamion = new Map<number, CostoMantenimiento[]>();
    for (const costo of costos) {
      if (!gastosPorCamion.has(costo.camionId)) {
        gastosPorCamion.set(costo.camionId, []);
      }
      gastosPorCamion.get(costo.camionId)!.push(costo);
    }

    const gastos = Array.from(gastosPorCamion.entries())
      .map(([camionId, registros]) => ({
        camionId,
        patente: registros[0]?.patente || '',
        registros: registros
          .sort((a, b) => b.fecha.localeCompare(a.fecha))
          .map((registro) => ({
            camionId: registro.camionId,
            patente: registro.patente,
            origen: registro.origen,
            tipoMantenimiento: registro.concepto,
            fecha: registro.fecha,
            costo: registro.costo,
            estado: registro.estado,
          })),
        totalGastos: this.round2(registros.reduce((sum, r) => sum + r.costo, 0)),
        cantidadRegistros: registros.length,
      }))
      .sort((a, b) => b.totalGastos - a.totalGastos);

    const resumenTotal = this.round2(gastos.reduce((sum, g) => sum + g.totalGastos, 0));

    return {
      filtrosAplicados: {
        desde: toDateOnly(desde),
        hasta: toDateOnly(hasta),
        camionIds: filters.camionIds,
      },
      resumenTotal,
      gastos,
    };
  }

  async getGastosFijos(filters: {
    desde?: Date;
    hasta?: Date;
    camionIds?: number[];
  }) {
    const hasta = filters.hasta || new Date();
    const desde = filters.desde || new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);

    const gastosFijos = await this.getGastosFijosProrrateables(filters.camionIds);
    const camionIds = [...new Set(gastosFijos.map((item) => item.gastoFijo.camionId))];
    const camiones = camionIds.length > 0
      ? await this.camionRepository.find({ where: { id: In(camionIds) } })
      : [];
    const camionPatenteById = new Map(camiones.map((camion) => [camion.id, camion.patente]));

    const gastosPorCamion = new Map<number, {
      camionId: number;
      patente: string;
      items: Array<{
        gastoFijoId: number;
        tipo: string;
        concepto: string;
        moneda: string;
        montoAnual: number;
        montoAnualUyu: number;
        costoMensualUyu: number;
        vigenciaDesde: string;
        vigenciaHasta: string | null;
        costoPeriodo: number;
      }>;
    }>();

    for (const item of gastosFijos) {
      const costoPeriodo = this.getGastoFijoCostForPeriod(item, desde, hasta);
      if (costoPeriodo <= 0) {
        continue;
      }

      const { gastoFijo } = item;
      if (!gastosPorCamion.has(gastoFijo.camionId)) {
        gastosPorCamion.set(gastoFijo.camionId, {
          camionId: gastoFijo.camionId,
          patente: camionPatenteById.get(gastoFijo.camionId) || '',
          items: [],
        });
      }

      gastosPorCamion.get(gastoFijo.camionId)!.items.push({
        gastoFijoId: gastoFijo.id,
        tipo: gastoFijo.tipo,
        concepto: gastoFijo.concepto || gastoFijo.tipo,
        moneda: gastoFijo.moneda,
        montoAnual: this.round2(this.toNumber(gastoFijo.montoAnual)),
        montoAnualUyu: this.round2(item.montoAnualUyu),
        costoMensualUyu: this.round2(item.montoAnualUyu / 12),
        vigenciaDesde: gastoFijo.vigenciaDesde,
        vigenciaHasta: gastoFijo.vigenciaHasta,
        costoPeriodo: this.round2(costoPeriodo),
      });
    }

    const gastos = Array.from(gastosPorCamion.values())
      .map((item) => ({
        camionId: item.camionId,
        patente: item.patente,
        cantidad: item.items.length,
        totalAnualUyu: this.round2(item.items.reduce((sum, gasto) => sum + gasto.montoAnualUyu, 0)),
        totalCostoPeriodo: this.round2(item.items.reduce((sum, gasto) => sum + gasto.costoPeriodo, 0)),
        items: item.items.sort((a, b) => b.costoPeriodo - a.costoPeriodo),
      }))
      .sort((a, b) => b.totalCostoPeriodo - a.totalCostoPeriodo);

    return {
      filtrosAplicados: {
        desde: toDateOnly(desde),
        hasta: toDateOnly(hasta),
        camionIds: filters.camionIds,
      },
      resumenTotalAnual: this.round2(gastos.reduce((sum, item) => sum + item.totalAnualUyu, 0)),
      resumenTotalPeriodo: this.round2(gastos.reduce((sum, item) => sum + item.totalCostoPeriodo, 0)),
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

    // Mismo criterio de gastos que el gráfico de rentabilidad, agrupado por mes
    const rentabilidad = await this.getRentabilidad({
      granularidad: 'mensual',
      desde,
      hasta,
      camionIds: filters.camionIds,
      choferIds: filters.choferIds,
    });

    const ingresos = rentabilidad.series
      .filter((point) => point.cantidadViajes > 0 || point.gastos > 0)
      .map((point) => ({
        mes: point.etiqueta,
        viajesCompletos: point.cantidadViajes,
        ingresos: point.ingresos,
        gastos: point.gastos,
        gananciaNeta: point.gananciaNeta,
        rentabilidad: point.ingresos > 0 ? this.round2((point.gananciaNeta / point.ingresos) * 100) : 0,
      }));

    const resumen = {
      totalViajesCompletos: ingresos.reduce((sum, m) => sum + m.viajesCompletos, 0),
      totalIngresos: this.round2(ingresos.reduce((sum, m) => sum + m.ingresos, 0)),
      totalGastos: this.round2(ingresos.reduce((sum, m) => sum + m.gastos, 0)),
      totalGananciaNeta: this.round2(ingresos.reduce((sum, m) => sum + m.gananciaNeta, 0)),
    };

    return {
      filtrosAplicados: {
        desde: toDateOnly(desde),
        hasta: toDateOnly(hasta),
        camionIds: filters.camionIds,
        choferIds: filters.choferIds,
      },
      resumen,
      ingresos,
    };
  }
}
