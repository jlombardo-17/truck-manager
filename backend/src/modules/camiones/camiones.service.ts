import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camion } from './camion.entity';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';

@Injectable()
export class CamionesService {
  constructor(
    @InjectRepository(Camion)
    private readonly camionesRepository: Repository<Camion>,
  ) {}

  findAll(): Promise<Camion[]> {
    return this.camionesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Camion> {
    const camion = await this.camionesRepository.findOne({ where: { id } });
    if (!camion) {
      throw new NotFoundException('Camion no encontrado');
    }
    return camion;
  }

  create(createCamionDto: CreateCamionDto): Promise<Camion> {
    const camion = this.camionesRepository.create({
      ...createCamionDto,
      patente: createCamionDto.patente.toUpperCase(),
    });
    return this.camionesRepository.save(camion);
  }

  async update(id: number, updateCamionDto: UpdateCamionDto): Promise<Camion> {
    const camion = await this.findOne(id);
    const nextPatente = updateCamionDto.patente ? updateCamionDto.patente.toUpperCase() : camion.patente;
    Object.assign(camion, { ...updateCamionDto, patente: nextPatente });
    return this.camionesRepository.save(camion);
  }

  async remove(id: number): Promise<{ message: string }> {
    const camion = await this.findOne(id);
    await this.camionesRepository.remove(camion);
    return { message: 'Camion eliminado correctamente' };
  }

  async updateOdometro(id: number, nuevoOdometro: number): Promise<Camion> {
    const camion = await this.findOne(id);
    camion.odometroKm = nuevoOdometro;
    return this.camionesRepository.save(camion);
  }
}
