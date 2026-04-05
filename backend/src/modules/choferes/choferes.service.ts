import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chofer } from './chofer.entity';
import { CreateChoferDto, UpdateChoferDto } from './dto/chofer.dto';

@Injectable()
export class ChoferesService {
  private readonly logger = new Logger(ChoferesService.name);

  constructor(
    @InjectRepository(Chofer)
    private choferesRepository: Repository<Chofer>,
  ) {}

  async findAll(): Promise<Chofer[]> {
    try {
      return await this.choferesRepository.find({
        order: {
          nombre: 'ASC',
        },
      });
    } catch (error) {
      this.logger.error('Error al obtener choferes', error);
      throw error;
    }
  }

  async findOne(id: number): Promise<Chofer> {
    let chofer: Chofer | null = null;
    try {
      chofer = await this.choferesRepository.findOne({
        where: { id },
        relations: ['user'],
      });
    } catch (error) {
      this.logger.warn(`No se pudo cargar relación user para chofer ${id}, reintentando sin relación`, error);
      chofer = await this.choferesRepository.findOne({ where: { id } });
    }

    if (!chofer) {
      throw new NotFoundException(`Chofer con ID ${id} no encontrado`);
    }

    return chofer;
  }

  async findByNumeroDocumento(numeroDocumento: string): Promise<Chofer> {
    let chofer: Chofer | null = null;
    try {
      chofer = await this.choferesRepository.findOne({
        where: { numeroDocumento },
        relations: ['user'],
      });
    } catch (error) {
      this.logger.warn(`No se pudo cargar relación user para numeroDocumento ${numeroDocumento}`, error);
      chofer = await this.choferesRepository.findOne({ where: { numeroDocumento } });
    }

    if (!chofer) {
      throw new NotFoundException(
        `Chofer con número de documento ${numeroDocumento} no encontrado`,
      );
    }

    return chofer;
  }

  async create(createChoferDto: CreateChoferDto): Promise<Chofer> {
    const chofer = this.choferesRepository.create(createChoferDto);
    return this.choferesRepository.save(chofer);
  }

  async update(id: number, updateChoferDto: UpdateChoferDto): Promise<Chofer> {
    const chofer = await this.findOne(id);
    Object.assign(chofer, updateChoferDto);
    return this.choferesRepository.save(chofer);
  }

  async remove(id: number): Promise<void> {
    const chofer = await this.findOne(id);
    await this.choferesRepository.remove(chofer);
  }
}
