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
}
