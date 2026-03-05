import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MantenimientoTipo } from './mantenimiento-tipo.entity';
import { MantenimientoRegistro, EstadoMantenimiento } from './mantenimiento-registro.entity';
import {
  CreateMantenimientoTipoDto,
  UpdateMantenimientoTipoDto,
  CreateMantenimientoRegistroDto,
  UpdateMantenimientoRegistroDto,
} from './dto/mantenimiento.dto';

@Injectable()
export class MantenimientoService {
  constructor(
    @InjectRepository(MantenimientoTipo)
    private tipoRepository: Repository<MantenimientoTipo>,
    @InjectRepository(MantenimientoRegistro)
    private registroRepository: Repository<MantenimientoRegistro>,
  ) {}

  // ============ TIPOS DE MANTENIMIENTO ============

  async getAllTipos(): Promise<MantenimientoTipo[]> {
    return await this.tipoRepository.find({ where: { activo: true } });
  }

  async getTipoById(id: number): Promise<MantenimientoTipo> {
    const tipo = await this.tipoRepository.findOne({ where: { id } });
    if (!tipo) {
      throw new NotFoundException(`Tipo de mantenimiento ${id} no encontrado`);
    }
    return tipo;
  }

  async createTipo(dto: CreateMantenimientoTipoDto): Promise<MantenimientoTipo> {
    const tipo = this.tipoRepository.create(dto);
    return await this.tipoRepository.save(tipo);
  }

  async updateTipo(id: number, dto: UpdateMantenimientoTipoDto): Promise<MantenimientoTipo> {
    const tipo = await this.getTipoById(id);
    Object.assign(tipo, dto);
    return await this.tipoRepository.save(tipo);
  }

  async deleteTipo(id: number): Promise<void> {
    const tipo = await this.getTipoById(id);
    tipo.activo = false;
    await this.tipoRepository.save(tipo);
  }

  // ============ REGISTROS DE MANTENIMIENTO ============

  async getRegistrosByCamion(camionId: number): Promise<MantenimientoRegistro[]> {
    return await this.registroRepository.find({
      where: { camionId },
      relations: ['tipo'],
      order: { fechaPrograma: 'DESC' },
    });
  }

  async getRegistroById(id: number): Promise<MantenimientoRegistro> {
    const registro = await this.registroRepository.findOne({
      where: { id },
      relations: ['camion', 'tipo'],
    });
    if (!registro) {
      throw new NotFoundException(`Registro de mantenimiento ${id} no encontrado`);
    }
    return registro;
  }

  async createRegistro(dto: CreateMantenimientoRegistroDto): Promise<MantenimientoRegistro> {
    const registro = this.registroRepository.create({
      ...dto,
      estado: EstadoMantenimiento.PENDIENTE,
    });
    return await this.registroRepository.save(registro);
  }

  async updateRegistro(id: number, dto: UpdateMantenimientoRegistroDto): Promise<MantenimientoRegistro> {
    const registro = await this.getRegistroById(id);
    Object.assign(registro, dto);
    return await this.registroRepository.save(registro);
  }

  async deleteRegistro(id: number): Promise<void> {
    const registro = await this.getRegistroById(id);
    await this.registroRepository.remove(registro);
  }

  async marcarComoCompletado(id: number, costoReal?: number, observaciones?: string): Promise<MantenimientoRegistro> {
    const registro = await this.getRegistroById(id);
    registro.estado = EstadoMantenimiento.COMPLETADO;
    registro.fechaRealizado = new Date();
    if (costoReal) registro.costoReal = costoReal;
    if (observaciones) registro.observaciones = observaciones;
    
    // Calcular próximo mantenimiento
    if (registro.tipo.intervaloDias) {
      const proxima = new Date(registro.fechaRealizado);
      proxima.setDate(proxima.getDate() + registro.tipo.intervaloDias);
      registro.proximaFecha = proxima;
    }
    
    return await this.registroRepository.save(registro);
  }

  // ============ ALERTAS ============

  async getProximosAVencer(camionId?: number, dias: number = 30): Promise<MantenimientoRegistro[]> {
    const hoy = new Date();
    const proximosDias = new Date();
    proximosDias.setDate(proximosDias.getDate() + dias);

    const query = this.registroRepository
      .createQueryBuilder('registro')
      .leftJoinAndSelect('registro.tipo', 'tipo')
      .where('registro.estado = :estado', { estado: EstadoMantenimiento.PENDIENTE })
      .andWhere('registro.proximaFecha <= :proximosDias', { proximosDias })
      .andWhere('registro.proximaFecha >= :hoy', { hoy });

    if (camionId) {
      query.andWhere('registro.camionId = :camionId', { camionId });
    }

    return await query.orderBy('registro.proximaFecha', 'ASC').getMany();
  }

  async getVencidos(camionId?: number): Promise<MantenimientoRegistro[]> {
    const hoy = new Date();

    const query = this.registroRepository
      .createQueryBuilder('registro')
      .leftJoinAndSelect('registro.tipo', 'tipo')
      .where('registro.estado = :estado', { estado: EstadoMantenimiento.PENDIENTE })
      .andWhere('registro.proximaFecha < :hoy', { hoy });

    if (camionId) {
      query.andWhere('registro.camionId = :camionId', { camionId });
    }

    return await query.orderBy('registro.proximaFecha', 'ASC').getMany();
  }

  async getEstadisticasCamion(camionId: number) {
    const registros = await this.getRegistrosByCamion(camionId);
    const vencidos = registros.filter((r) => r.proximaFecha && new Date(r.proximaFecha) < new Date());
    const proximos = registros.filter(
      (r) =>
        r.proximaFecha &&
        new Date(r.proximaFecha) >= new Date() &&
        new Date(r.proximaFecha) <= new Date(new Date().setDate(new Date().getDate() + 30)),
    );

    const costoTotal = registros
      .filter((r) => r.costoReal)
      .reduce((sum, r) => sum + (r.costoReal || 0), 0);

    return {
      totalRegistros: registros.length,
      completados: registros.filter((r) => r.estado === EstadoMantenimiento.COMPLETADO).length,
      pendientes: registros.filter((r) => r.estado === EstadoMantenimiento.PENDIENTE).length,
      vencidos: vencidos.length,
      proximosVencer: proximos.length,
      costoTotal,
    };
  }
}
