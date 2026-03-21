import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  private normalizeRutas(documento: Documento): Documento {
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

  async findByCamion(camionId: number): Promise<Documento[]> {
    const documentos = await this.documentosRepository.find({
      where: { camionId },
      order: { createdAt: 'DESC' },
    });

    return documentos.map((documento) => this.normalizeRutas(documento));
  }

  async findOne(id: number): Promise<Documento> {
    const documento = await this.documentosRepository.findOne({ where: { id } });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }
    return this.normalizeRutas(documento);
  }

  async create(camionId: number, createDocumentoDto: CreateDocumentoDto): Promise<Documento> {
    const rutasArchivos = this.resolveRutasArchivos(createDocumentoDto);
    if (rutasArchivos.length === 0) {
      throw new BadRequestException('Debes enviar al menos un archivo para el documento');
    }

    const documento = this.documentosRepository.create({
      ...createDocumentoDto,
      camionId,
      rutaArchivo: rutasArchivos[0],
      rutasArchivos,
    });
    const saved = await this.documentosRepository.save(documento);
    return this.normalizeRutas(saved);
  }

  async update(id: number, updateDocumentoDto: UpdateDocumentoDto): Promise<Documento> {
    const documento = await this.findOne(id);

    if (updateDocumentoDto.rutasArchivos) {
      const rutasArchivos = this.resolveRutasArchivos(updateDocumentoDto);
      if (rutasArchivos.length === 0) {
        throw new BadRequestException('Debes enviar al menos un archivo para el documento');
      }

      updateDocumentoDto.rutasArchivos = rutasArchivos;
      updateDocumentoDto.rutaArchivo = rutasArchivos[0];
    } else if (updateDocumentoDto.rutaArchivo && updateDocumentoDto.rutaArchivo.trim().length > 0) {
      updateDocumentoDto.rutasArchivos = [updateDocumentoDto.rutaArchivo];
    }

    Object.assign(documento, updateDocumentoDto);
    const saved = await this.documentosRepository.save(documento);
    return this.normalizeRutas(saved);
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

    return documentos.map((documento) => this.normalizeRutas(documento));
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

    return documentos.map((documento) => this.normalizeRutas(documento));
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
