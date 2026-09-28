import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { CategoriaJornada, ChoferJornada } from './chofer-jornada.entity';
import { ChoferViatico } from './chofer-viatico.entity';
import { ViaticoTipo } from './viatico-tipo.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Viaje } from '../viajes/viaje.entity';
import { SalariosService } from '../choferes/salarios.service';
import { EstadoSalario } from '../choferes/chofer-salario.entity';
import { BulkJornadaDto, UpsertJornadaDto } from './dto/jornada.dto';

const MAX_DIAS_RANGO = 62;
const MAX_DIAS_REPORTE = 366;

export interface ViajeSugerido {
  choferId: number;
  fecha: string;
  viajeId: number;
  numeroViaje: string;
  origen: string;
  destino: string;
}

export interface SalarioAfectado {
  choferId: number;
  mes: number;
  anio: number;
  salarioId: number;
  estado: EstadoSalario;
  actualizado: boolean;
}

export interface ReporteViaticosChofer {
  choferId: number;
  nombre: string;
  apellido: string;
  cantidad: number;
  total: number;
  detalle: { concepto: string; montoUnitario: number; cantidad: number; total: number }[];
}

export interface ResumenChofer {
  choferId: number;
  nombre: string;
  apellido: string;
  dias: Record<CategoriaJornada, number>;
  diasRegistrados: number;
  cantidadViaticos: number;
  totalViaticos: number;
}

@Injectable()
export class JornadasService {
  constructor(
    @InjectRepository(ChoferJornada)
    private readonly jornadaRepository: Repository<ChoferJornada>,
    @InjectRepository(ChoferViatico)
    private readonly viaticoRepository: Repository<ChoferViatico>,
    @InjectRepository(ViaticoTipo)
    private readonly viaticoTipoRepository: Repository<ViaticoTipo>,
    @InjectRepository(Chofer)
    private readonly choferRepository: Repository<Chofer>,
    @InjectRepository(Viaje)
    private readonly viajeRepository: Repository<Viaje>,
    private readonly salariosService: SalariosService,
    private readonly dataSource: DataSource,
  ) {}

  // ---------- helpers de fechas (siempre YYYY-MM-DD, sin depender de la zona horaria) ----------

  private normalizarFecha(value: string): string {
    const fecha = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException(`Fecha inválida: ${value}`);
    }
    return fecha;
  }

  private sumarDias(fecha: string, dias: number): string {
    const [y, m, d] = fecha.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
  }

  private fechasEntre(desde: string, hasta: string): string[] {
    const fechas: string[] = [];
    for (let f = desde; f <= hasta; f = this.sumarDias(f, 1)) {
      fechas.push(f);
    }
    return fechas;
  }

  private validarRango(desde: string, hasta: string, maxDias = MAX_DIAS_RANGO): string[] {
    if (desde > hasta) {
      throw new BadRequestException('La fecha desde no puede ser posterior a la fecha hasta');
    }
    const fechas = this.fechasEntre(desde, hasta);
    if (fechas.length > maxDias) {
      throw new BadRequestException(`El rango no puede superar ${maxDias} días`);
    }
    return fechas;
  }

  /**
   * Los viajes guardan la fecha elegida como medianoche UTC (en la DB queda p.ej.
   * '2026-09-23 21:00' para el día 24 en UY), por eso el día real es el de UTC.
   */
  private fechaViaje(date: Date): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private periodoDe(fecha: string): { mes: number; anio: number } {
    const [anio, mes] = fecha.split('-').map(Number);
    return { mes, anio };
  }

  parseIds(value: string): number[] {
    return [...new Set(value.split(',').map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  }

  // ---------- consultas ----------

  async findByRango(
    choferIds: number[],
    desde: string,
    hasta: string,
  ): Promise<{ jornadas: ChoferJornada[]; viajesSugeridos: ViajeSugerido[] }> {
    desde = this.normalizarFecha(desde);
    hasta = this.normalizarFecha(hasta);
    this.validarRango(desde, hasta);

    if (choferIds.length === 0) {
      return { jornadas: [], viajesSugeridos: [] };
    }

    const jornadas = await this.jornadaRepository
      .createQueryBuilder('j')
      .leftJoinAndSelect('j.viaticos', 'v')
      .where('j.choferId IN (:...choferIds)', { choferIds })
      .andWhere('j.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .orderBy('j.fecha', 'ASC')
      .addOrderBy('v.id', 'ASC')
      .getMany();

    const viajesSugeridos = await this.getViajesSugeridos(choferIds, desde, hasta, jornadas);
    return { jornadas, viajesSugeridos };
  }

  /**
   * Días sin jornada registrada en los que el chofer tenía un viaje en curso.
   */
  private async getViajesSugeridos(
    choferIds: number[],
    desde: string,
    hasta: string,
    jornadas: ChoferJornada[],
  ): Promise<ViajeSugerido[]> {
    const viajes = await this.viajeRepository
      .createQueryBuilder('viaje')
      .innerJoin('viaje.chofer', 'chofer')
      .select(['viaje.id', 'viaje.numeroViaje', 'viaje.fechaInicio', 'viaje.fechaFin', 'viaje.origen', 'viaje.destino'])
      .addSelect('chofer.id')
      .where('chofer.id IN (:...choferIds)', { choferIds })
      // Margen de un día por el desfase de zona horaria; se recorta en memoria
      .andWhere('DATE(viaje.fechaInicio) <= :hasta', { hasta })
      .andWhere('DATE(COALESCE(viaje.fechaFin, viaje.fechaInicio)) >= :desdeMargen', {
        desdeMargen: this.sumarDias(desde, -1),
      })
      .orderBy('viaje.fechaInicio', 'ASC')
      .getMany();

    const ocupados = new Set(jornadas.map((j) => `${j.choferId}|${j.fecha}`));
    const sugeridos = new Map<string, ViajeSugerido>();

    for (const viaje of viajes) {
      const inicio = this.fechaViaje(viaje.fechaInicio);
      const fin = viaje.fechaFin ? this.fechaViaje(viaje.fechaFin) : inicio;
      const desdeViaje = inicio > desde ? inicio : desde;
      const hastaViaje = fin < hasta ? fin : hasta;

      for (const fecha of this.fechasEntre(desdeViaje, hastaViaje)) {
        const key = `${viaje.chofer.id}|${fecha}`;
        if (ocupados.has(key) || sugeridos.has(key)) continue;
        sugeridos.set(key, {
          choferId: viaje.chofer.id,
          fecha,
          viajeId: viaje.id,
          numeroViaje: viaje.numeroViaje,
          origen: viaje.origen,
          destino: viaje.destino,
        });
      }
    }

    return [...sugeridos.values()];
  }

  async resumen(choferIds: number[], anio: number, mes: number): Promise<ResumenChofer[]> {
    if (choferIds.length === 0) return [];

    const mm = String(mes).padStart(2, '0');
    const desde = `${anio}-${mm}-01`;
    const hasta = `${anio}-${mm}-${String(new Date(anio, mes, 0).getDate()).padStart(2, '0')}`;

    const choferes = await this.choferRepository.find({ where: { id: In(choferIds) } });

    const conteos = await this.jornadaRepository
      .createQueryBuilder('j')
      .select('j.choferId', 'choferId')
      .addSelect('j.categoria', 'categoria')
      .addSelect('COUNT(*)', 'cantidad')
      .where('j.choferId IN (:...choferIds)', { choferIds })
      .andWhere('j.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .groupBy('j.choferId')
      .addGroupBy('j.categoria')
      .getRawMany<{ choferId: string; categoria: CategoriaJornada; cantidad: string }>();

    const viaticos = await this.viaticoRepository
      .createQueryBuilder('v')
      .innerJoin('v.jornada', 'j')
      .select('j.choferId', 'choferId')
      .addSelect('COALESCE(SUM(v.cantidad), 0)', 'cantidad')
      .addSelect('COALESCE(SUM(v.cantidad * v.monto), 0)', 'total')
      .where('j.choferId IN (:...choferIds)', { choferIds })
      .andWhere('j.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .groupBy('j.choferId')
      .getRawMany<{ choferId: string; cantidad: string; total: string }>();

    return choferes.map((chofer) => {
      const dias = Object.values(CategoriaJornada).reduce(
        (acc, cat) => ({ ...acc, [cat]: 0 }),
        {} as Record<CategoriaJornada, number>,
      );
      conteos
        .filter((c) => Number(c.choferId) === chofer.id)
        .forEach((c) => (dias[c.categoria] = Number(c.cantidad)));
      const v = viaticos.find((x) => Number(x.choferId) === chofer.id);

      return {
        choferId: chofer.id,
        nombre: chofer.nombre,
        apellido: chofer.apellido,
        dias,
        diasRegistrados: Object.values(dias).reduce((a, b) => a + b, 0),
        cantidadViaticos: Number(v?.cantidad ?? 0),
        totalViaticos: parseFloat(v?.total ?? '0') || 0,
      };
    });
  }

  /**
   * Cantidad y monto de viáticos por chofer en una ventana de tiempo,
   * desglosado por concepto y monto unitario.
   */
  async reporteViaticos(choferIds: number[], desde: string, hasta: string): Promise<ReporteViaticosChofer[]> {
    desde = this.normalizarFecha(desde);
    hasta = this.normalizarFecha(hasta);
    this.validarRango(desde, hasta, MAX_DIAS_REPORTE);
    if (choferIds.length === 0) return [];

    const choferes = await this.choferRepository.find({
      where: { id: In(choferIds) },
      order: { nombre: 'ASC', apellido: 'ASC' },
    });

    const filas = await this.viaticoRepository
      .createQueryBuilder('v')
      .innerJoin('v.jornada', 'j')
      .select('j.choferId', 'choferId')
      .addSelect('v.concepto', 'concepto')
      .addSelect('v.monto', 'montoUnitario')
      .addSelect('SUM(v.cantidad)', 'cantidad')
      .addSelect('SUM(v.cantidad * v.monto)', 'total')
      .where('j.choferId IN (:...choferIds)', { choferIds })
      .andWhere('j.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .groupBy('j.choferId')
      .addGroupBy('v.concepto')
      .addGroupBy('v.monto')
      .orderBy('v.concepto', 'ASC')
      .addOrderBy('v.monto', 'DESC')
      .getRawMany<{ choferId: string; concepto: string; montoUnitario: string; cantidad: string; total: string }>();

    return choferes.map((chofer) => {
      const detalle = filas
        .filter((f) => Number(f.choferId) === chofer.id)
        .map((f) => ({
          concepto: f.concepto,
          montoUnitario: parseFloat(f.montoUnitario) || 0,
          cantidad: Number(f.cantidad),
          total: parseFloat(f.total) || 0,
        }));
      return {
        choferId: chofer.id,
        nombre: chofer.nombre,
        apellido: chofer.apellido,
        cantidad: detalle.reduce((acc, d) => acc + d.cantidad, 0),
        total: detalle.reduce((acc, d) => acc + d.total, 0),
        detalle,
      };
    });
  }

  // ---------- escritura ----------

  async upsert(dto: UpsertJornadaDto): Promise<{ jornada: ChoferJornada; salario: SalarioAfectado | null }> {
    const fecha = this.normalizarFecha(dto.fecha);
    await this.assertChoferesExisten([dto.choferId]);

    if (dto.viaticos?.length) {
      const tipoIds = [...new Set(dto.viaticos.map((v) => v.viaticoTipoId).filter((id): id is number => !!id))];
      if (tipoIds.length) {
        const count = await this.viaticoTipoRepository.count({ where: { id: In(tipoIds) } });
        if (count !== tipoIds.length) {
          throw new BadRequestException('Alguno de los tipos de viático indicados no existe');
        }
      }
    }

    const jornadaId = await this.dataSource.transaction(async (manager) => {
      const jornada = await this.guardarJornada(manager, dto.choferId, fecha, {
        categoria: dto.categoria,
        lugarTrabajo: dto.lugarTrabajo?.trim() || null,
        viajeId: dto.viajeId ?? null,
        observaciones: dto.observaciones?.trim() || null,
      });

      // undefined = no tocar los viáticos; [] = eliminarlos todos
      if (dto.viaticos !== undefined) {
        await manager.delete(ChoferViatico, { jornadaId: jornada.id });
        if (dto.viaticos.length) {
          await manager.save(
            ChoferViatico,
            dto.viaticos.map((v) =>
              manager.create(ChoferViatico, {
                jornadaId: jornada.id,
                viaticoTipoId: v.viaticoTipoId ?? null,
                concepto: v.concepto.trim(),
                cantidad: v.cantidad ?? 1,
                monto: v.monto,
                observaciones: v.observaciones?.trim() || null,
              }),
            ),
          );
        }
      }
      return jornada.id;
    });

    const [salario] = await this.recalcularSalarios([{ choferId: dto.choferId, ...this.periodoDe(fecha) }]);
    return { jornada: await this.findOneOrFail(jornadaId), salario: salario ?? null };
  }

  async bulk(dto: BulkJornadaDto): Promise<{ procesadas: number; salarios: SalarioAfectado[] }> {
    const desde = this.normalizarFecha(dto.desde);
    const hasta = this.normalizarFecha(dto.hasta);
    const fechas = this.validarRango(desde, hasta);
    const choferIds = [...new Set(dto.choferIds)];
    await this.assertChoferesExisten(choferIds);

    await this.dataSource.transaction(async (manager) => {
      for (const choferId of choferIds) {
        for (const fecha of fechas) {
          const datos: Partial<ChoferJornada> = { categoria: dto.categoria };
          if (dto.lugarTrabajo !== undefined) datos.lugarTrabajo = dto.lugarTrabajo.trim() || null;
          if (dto.observaciones !== undefined) datos.observaciones = dto.observaciones.trim() || null;
          await this.guardarJornada(manager, choferId, fecha, datos);
        }
      }
    });

    const periodos = new Map<string, { choferId: number; mes: number; anio: number }>();
    for (const choferId of choferIds) {
      for (const fecha of fechas) {
        const p = { choferId, ...this.periodoDe(fecha) };
        periodos.set(`${p.choferId}|${p.anio}|${p.mes}`, p);
      }
    }

    // Los viáticos existentes se conservan, pero igual se recalcula por consistencia
    const salarios = await this.recalcularSalarios([...periodos.values()]);
    return { procesadas: choferIds.length * fechas.length, salarios };
  }

  async remove(id: number): Promise<{ salario: SalarioAfectado | null }> {
    const jornada = await this.jornadaRepository.findOne({ where: { id } });
    if (!jornada) {
      throw new NotFoundException(`Jornada con ID ${id} no encontrada`);
    }
    await this.jornadaRepository.remove(jornada);
    const [salario] = await this.recalcularSalarios([{ choferId: jornada.choferId, ...this.periodoDe(jornada.fecha) }]);
    return { salario: salario ?? null };
  }

  private async guardarJornada(
    manager: EntityManager,
    choferId: number,
    fecha: string,
    datos: Partial<ChoferJornada>,
  ): Promise<ChoferJornada> {
    const existente = await manager.findOne(ChoferJornada, { where: { choferId, fecha } });
    if (existente) {
      Object.assign(existente, datos);
      return await manager.save(ChoferJornada, existente);
    }
    return await manager.save(ChoferJornada, manager.create(ChoferJornada, { choferId, fecha, ...datos }));
  }

  private async findOneOrFail(id: number): Promise<ChoferJornada> {
    const jornada = await this.jornadaRepository.findOne({
      where: { id },
      relations: ['viaticos'],
      order: { viaticos: { id: 'ASC' } },
    });
    if (!jornada) {
      throw new NotFoundException(`Jornada con ID ${id} no encontrada`);
    }
    return jornada;
  }

  private async assertChoferesExisten(choferIds: number[]): Promise<void> {
    const count = await this.choferRepository.count({ where: { id: In(choferIds) } });
    if (count !== choferIds.length) {
      throw new NotFoundException('Alguno de los choferes indicados no existe');
    }
  }

  private async recalcularSalarios(
    periodos: { choferId: number; mes: number; anio: number }[],
  ): Promise<SalarioAfectado[]> {
    const afectados: SalarioAfectado[] = [];
    for (const p of periodos) {
      const res = await this.salariosService.recalcularViaticos(p.choferId, p.mes, p.anio);
      if (res) afectados.push({ ...p, ...res });
    }
    return afectados;
  }
}
