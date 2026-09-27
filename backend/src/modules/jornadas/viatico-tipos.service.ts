import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViaticoTipo } from './viatico-tipo.entity';
import { CreateViaticoTipoDto, UpdateViaticoTipoDto } from './dto/jornada.dto';

@Injectable()
export class ViaticoTiposService {
  constructor(
    @InjectRepository(ViaticoTipo)
    private readonly viaticoTipoRepository: Repository<ViaticoTipo>,
  ) {}

  async findAll(incluirInactivos = false): Promise<ViaticoTipo[]> {
    return await this.viaticoTipoRepository.find({
      where: incluirInactivos ? {} : { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ViaticoTipo> {
    const tipo = await this.viaticoTipoRepository.findOne({ where: { id } });
    if (!tipo) {
      throw new NotFoundException(`Tipo de viático con ID ${id} no encontrado`);
    }
    return tipo;
  }

  async create(dto: CreateViaticoTipoDto): Promise<ViaticoTipo> {
    await this.assertNombreDisponible(dto.nombre);
    return await this.viaticoTipoRepository.save(
      this.viaticoTipoRepository.create({ ...dto, nombre: dto.nombre.trim() }),
    );
  }

  async update(id: number, dto: UpdateViaticoTipoDto): Promise<ViaticoTipo> {
    const tipo = await this.findOne(id);
    if (dto.nombre !== undefined) {
      await this.assertNombreDisponible(dto.nombre, id);
      dto.nombre = dto.nombre.trim();
    }
    Object.assign(tipo, dto);
    return await this.viaticoTipoRepository.save(tipo);
  }

  private async assertNombreDisponible(nombre: string, excluirId?: number): Promise<void> {
    const existente = await this.viaticoTipoRepository.findOne({ where: { nombre: nombre.trim() } });
    if (existente && existente.id !== excluirId) {
      throw new BadRequestException(`Ya existe un tipo de viático llamado "${nombre.trim()}"`);
    }
  }
}
