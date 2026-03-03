import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chofer } from './chofer.entity';
import { CreateChoferDto, UpdateChoferDto } from './dto/chofer.dto';

@Injectable()
export class ChoferesService {
  constructor(
    @InjectRepository(Chofer)
    private choferesRepository: Repository<Chofer>,
  ) {}

  async findAll(): Promise<Chofer[]> {
    return this.choferesRepository.find({
      order: {
        nombre: 'ASC',
      },
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<Chofer> {
    const chofer = await this.choferesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!chofer) {
      throw new NotFoundException(`Chofer con ID ${id} no encontrado`);
    }

    return chofer;
  }

  async findByNumeroDocumento(numeroDocumento: string): Promise<Chofer> {
    const chofer = await this.choferesRepository.findOne({
      where: { numeroDocumento },
      relations: ['user'],
    });

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
