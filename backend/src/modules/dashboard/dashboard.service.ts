import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Viaje } from '../viajes/viaje.entity';
import { Repostada } from '../camiones/repostada.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { ChoferDocumento } from '../choferes/chofer-documento.entity';

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
  constructor(
    @InjectRepository(Viaje)
    private viajesRepository: Repository<Viaje>,
    @InjectRepository(Repostada)
    private repostadasRepository: Repository<Repostada>,
    @InjectRepository(MantenimientoRegistro)
    private mantenimientoRepository: Repository<MantenimientoRegistro>,
    @InjectRepository(ChoferDocumento)
    private choferDocumentosRepository: Repository<ChoferDocumento>,
  ) {}

  async getResumen(): Promise<DashboardResumen> {
    const ahora = new Date();
    const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const ultimoDiaDelMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth() + 1,
      0,
    );

    // Viajes completados del mes
    const viajesMes = await this.viajesRepository.find({
      relations: ['camion', 'chofer'],
      where: {
        estado: 'completado' as any,
        fechaInicio: MoreThanOrEqual(primerDiaDelMes) as any,
      },
    });

    // Ingresos del mes
    const ingresosDelMes = viajesMes.reduce(
      (sum, v) => sum + parseFloat((v.valorViaje || 0).toString()),
      0,
    );

    // Gastos del mes (combustible + mantenimiento)
    const repostadasMes = await this.repostadasRepository.find({
      where: {
        fechaRepostada: MoreThanOrEqual(primerDiaDelMes) as any,
      },
    });

    const mantenimientoMes = await this.mantenimientoRepository.find({
      relations: ['camion'],
      where: {
        fechaPrograma: MoreThanOrEqual(primerDiaDelMes) as any,
      },
    });

    const gastoCombustible = repostadasMes.reduce(
      (sum, r) => sum + parseFloat((r.costo || 0).toString()),
      0,
    );
    const gastoMantenimiento = mantenimientoMes.reduce(
      (sum, m) => sum + parseFloat((m.costoReal || 0).toString()),
      0,
    );
    const gastosDelMes = gastoCombustible + gastoMantenimiento;

    // Camiones activos hoy (viajes completados o en progreso hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mananaInicio = new Date(hoy);
    mananaInicio.setDate(mananaInicio.getDate() + 1);

    const viajesHoy = await this.viajesRepository.find({
      where: {
        fechaInicio: MoreThanOrEqual(hoy) as any,
      },
    });
    const camionesActivosHoy = new Set(viajesHoy.map((v) => v.camionId)).size;

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
      camionesActivos: camionesActivosHoy,
      viajesCompletados: viajesMes.length,
      mantenimientoPendiente: [],
      documentosPorVencer: documentosFormato,
    };
  }

  async getDesempenoCamiones(): Promise<DesempenoCamion[]> {
    const ahora = new Date();
    const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    // Obtener viajes del mes por camión
    const viajesPorCamion = await this.viajesRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.camion', 'camion')
      .where('v.estado = :estado', { estado: 'completado' })
      .andWhere('v.fechaInicio >= :desde', { desde: primerDiaDelMes })
      .getMany();

    // Agrupar por camión
    const camionesMap = new Map<number, any>();

    for (const viaje of viajesPorCamion) {
      if (!camionesMap.has(viaje.camionId)) {
        camionesMap.set(viaje.camionId, {
          id: viaje.camionId,
          patente: viaje.camion?.patente || '',
          ingresos: 0,
          kmRecorridos: 0,
          viajesCompletos: 0,
        });
      }

      const camion = camionesMap.get(viaje.camionId);
      camion.ingresos += parseFloat((viaje.valorViaje || 0).toString());
      camion.kmRecorridos += parseFloat((viaje.kmRecorridos || 0).toString());
      camion.viajesCompletos += 1;
    }

    // Calcular gastos por camión
    const repostadas = await this.repostadasRepository.find({
      where: {
        fechaRepostada: MoreThanOrEqual(primerDiaDelMes) as any,
      },
    });

    const mantenimientos = await this.mantenimientoRepository.find({
      relations: ['camion'],
      where: {
        fechaPrograma: MoreThanOrEqual(primerDiaDelMes) as any,
      },
    });

    // Agrupar gastos por camión
    const gastosMap = new Map<number, number>();

    repostadas.forEach((r) => {
      const camionId = r.camionId;
      if (!gastosMap.has(camionId)) gastosMap.set(camionId, 0);
      gastosMap.set(
        camionId,
        gastosMap.get(camionId) + parseFloat((r.costo || 0).toString()),
      );
    });

    mantenimientos.forEach((m) => {
      const camionId = m.camionId;
      if (!gastosMap.has(camionId)) gastosMap.set(camionId, 0);
      gastosMap.set(
        camionId,
        gastosMap.get(camionId) + parseFloat((m.costoReal || 0).toString()),
      );
    });

    // Calcular eficiencia
    const resultado: DesempenoCamion[] = Array.from(camionesMap.values()).map(
      (camion) => {
        const gastos = gastosMap.get(camion.id) || 0;
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

    const viajes = await this.viajesRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.chofer', 'chofer')
      .leftJoinAndSelect('v.comisiones', 'comisiones')
      .where('v.estado = :estado', { estado: 'completado' })
      .andWhere('v.fechaInicio >= :desde', { desde: primerDiaDelMes })
      .getMany();

    // Agrupar por chofer
    const choferesMap = new Map<number, any>();

    for (const viaje of viajes) {
      if (!choferesMap.has(viaje.choferId)) {
        choferesMap.set(viaje.choferId, {
          id: viaje.choferId,
          nombre: viaje.chofer?.nombre || '',
          viajesCompletos: 0,
          ingresos: 0,
          comisiones: 0,
          puntualidad: 100,
        });
      }

      const chofer = choferesMap.get(viaje.choferId);
      chofer.viajesCompletos += 1;
      chofer.ingresos += parseFloat((viaje.valorViaje || 0).toString());
      const comisionTotal =
        viaje.comisiones?.reduce(
          (sum, c) => sum + parseFloat((c.montoTotal || 0).toString()),
          0,
        ) || 0;
      chofer.comisiones += comisionTotal;
    }

    return Array.from(choferesMap.values()).sort(
      (a, b) => b.viajesCompletos - a.viajesCompletos,
    );
  }
}
