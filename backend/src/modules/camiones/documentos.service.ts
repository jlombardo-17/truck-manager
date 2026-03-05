import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from './documento.entity';
import { CreateDocumentoDto, UpdateDocumentoDto } from './dto/documento.dto';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentosRepository: Repository<Documento>,
  ) {}

  findByCamion(camionId: number): Promise<Documento[]> {
    return this.documentosRepository.find({
      where: { camionId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Documento> {
    const documento = await this.documentosRepository.findOne({ where: { id } });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }
    return documento;
  }

  create(camionId: number, createDocumentoDto: CreateDocumentoDto): Promise<Documento> {
    const documento = this.documentosRepository.create({
      ...createDocumentoDto,
      camionId,
    });
    return this.documentosRepository.save(documento);
  }

  async update(id: number, updateDocumentoDto: UpdateDocumentoDto): Promise<Documento> {
    const documento = await this.findOne(id);
    Object.assign(documento, updateDocumentoDto);
    return this.documentosRepository.save(documento);
  }

  async remove(id: number): Promise<{ message: string }> {
    const documento = await this.findOne(id);
    await this.documentosRepository.remove(documento);
    return { message: 'Documento eliminado correctamente' };
  }

  /**
   * Obtiene documentos próximos a vencer (dentro de X días)
   */
  async findProximosAVencer(dias: number = 30): Promise<Documento[]> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const documentos = await this.documentosRepository
      .createQueryBuilder('documento')
      .where('documento.fechaVencimiento IS NOT NULL')
      .andWhere('documento.fechaVencimiento <= :fechaLimite', { fechaLimite })
      .andWhere('documento.fechaVencimiento >= :hoy', { hoy: new Date() })
      .orderBy('documento.fechaVencimiento', 'ASC')
      .getMany();

    return documentos;
  }

  /**
   * Obtiene documentos vencidos
   */
  async findVencidos(): Promise<Documento[]> {
    const documentos = await this.documentosRepository
      .createQueryBuilder('documento')
      .where('documento.fechaVencimiento IS NOT NULL')
      .andWhere('documento.fechaVencimiento < :hoy', { hoy: new Date() })
      .orderBy('documento.fechaVencimiento', 'DESC')
      .getMany();

    return documentos;
  }

  /**
   * Calcula el estado de un documento
   */
  getEstadoDocumento(documento: Documento): 'vigente' | 'proximo_vencer' | 'vencido' | 'sin_vencimiento' {
    if (!documento.fechaVencimiento) {
      return 'sin_vencimiento';
    }

    const hoy = new Date();
    const fechaVencimiento = new Date(documento.fechaVencimiento);
    const diasRestantes = Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return 'vencido';
    } else if (diasRestantes <= 30) {
      return 'proximo_vencer';
    } else {
      return 'vigente';
    }
  }
}
