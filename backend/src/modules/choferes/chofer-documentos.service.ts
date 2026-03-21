import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  private normalizeRutas(documento: ChoferDocumento): ChoferDocumento {
    if (!documento.rutasArchivos || documento.rutasArchivos.length === 0) {
      documento.rutasArchivos = documento.rutaArchivo ? [documento.rutaArchivo] : [];
    }

    if (!documento.rutaArchivo && documento.rutasArchivos.length > 0) {
      documento.rutaArchivo = documento.rutasArchivos[0];
    }

    return documento;
  }

  private resolveRutasArchivos(data: { rutaArchivo?: string; rutasArchivos?: string[] }): string[] {
    const rutas = (data.rutasArchivos || []).filter((ruta) => typeof ruta === 'string' && ruta.trim().length > 0);

    if (rutas.length > 0) {
      return rutas;
    }

    if (data.rutaArchivo && data.rutaArchivo.trim().length > 0) {
      return [data.rutaArchivo];
    }

    return [];
  }

  async findAll(): Promise<ChoferDocumento[]> {
    const documentos = await this.documentoRepository.find({
      order: { createdAt: 'DESC' },
    });

    return documentos.map((documento) => this.normalizeRutas(documento));
  }

  async findByChoferId(choferId: number): Promise<ChoferDocumento[]> {
    const documentos = await this.documentoRepository.find({
      where: { choferId },
      order: { createdAt: 'DESC' },
    });

    return documentos.map((documento) => this.normalizeRutas(documento));
  }

  async findById(id: number): Promise<ChoferDocumento> {
    const documento = await this.documentoRepository.findOne({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado`);
    }

    return this.normalizeRutas(documento);
  }

  async create(createDto: CreateChoferDocumentoDto): Promise<ChoferDocumento> {
    const rutasArchivos = this.resolveRutasArchivos(createDto);
    if (rutasArchivos.length === 0) {
      throw new BadRequestException('Debes enviar al menos un archivo para el documento');
    }

    const documento = this.documentoRepository.create(createDto);
    documento.rutasArchivos = rutasArchivos;
    documento.rutaArchivo = rutasArchivos[0];

    const saved = await this.documentoRepository.save(documento);
    return this.normalizeRutas(saved);
  }

  async update(id: number, updateDto: UpdateChoferDocumentoDto): Promise<ChoferDocumento> {
    const documento = await this.findById(id);

    if (updateDto.rutasArchivos) {
      const rutasArchivos = this.resolveRutasArchivos(updateDto);
      if (rutasArchivos.length === 0) {
        throw new BadRequestException('Debes enviar al menos un archivo para el documento');
      }

      updateDto.rutasArchivos = rutasArchivos;
      updateDto.rutaArchivo = rutasArchivos[0];
    } else if (updateDto.rutaArchivo && updateDto.rutaArchivo.trim().length > 0) {
      updateDto.rutasArchivos = [updateDto.rutaArchivo];
    }

    Object.assign(documento, updateDto);
    const saved = await this.documentoRepository.save(documento);
    return this.normalizeRutas(saved);
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

    return documentos.map((documento) => this.normalizeRutas(documento));
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

    return documentos.map((documento) => this.normalizeRutas(documento));
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
