import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChoferDocumento } from './chofer-documento.entity';
import { CreateChoferDocumentoDto, UpdateChoferDocumentoDto } from './dto/chofer-documento.dto';

@Injectable()
export class ChoferDocumentosService {
  constructor(
    @InjectRepository(ChoferDocumento)
    private documentoRepository: Repository<ChoferDocumento>,
  ) {}

  async findAll(): Promise<ChoferDocumento[]> {
    return await this.documentoRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByChoferId(choferId: number): Promise<ChoferDocumento[]> {
    return await this.documentoRepository.find({
      where: { choferId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<ChoferDocumento> {
    const documento = await this.documentoRepository.findOne({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado`);
    }

    return documento;
  }

  async create(createDto: CreateChoferDocumentoDto): Promise<ChoferDocumento> {
    const documento = this.documentoRepository.create(createDto);
    return await this.documentoRepository.save(documento);
  }

  async update(id: number, updateDto: UpdateChoferDocumentoDto): Promise<ChoferDocumento> {
    const documento = await this.findById(id);
    Object.assign(documento, updateDto);
    return await this.documentoRepository.save(documento);
  }

  async delete(id: number): Promise<void> {
    const documento = await this.findById(id);
    await this.documentoRepository.remove(documento);
  }

  /**
   * Obtiene documentos próximos a vencer (dentro de X días)
   */
  async findProximosAVencer(dias: number = 30): Promise<ChoferDocumento[]> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const documentos = await this.documentoRepository
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
  async findVencidos(): Promise<ChoferDocumento[]> {
    const documentos = await this.documentoRepository
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
  getEstadoDocumento(documento: ChoferDocumento): 'vigente' | 'proximo_vencer' | 'vencido' | 'sin_vencimiento' {
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
