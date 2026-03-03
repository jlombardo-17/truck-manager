import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './servicio.entity';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly serviciosRepository: Repository<Servicio>,
  ) {}

  findByCamion(camionId: number): Promise<Servicio[]> {
    return this.serviciosRepository.find({
      where: { camionId },
      order: { fechaServicio: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Servicio> {
    const servicio = await this.serviciosRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return servicio;
  }

  create(camionId: number, createServicioDto: CreateServicioDto): Promise<Servicio> {
    const servicio = this.serviciosRepository.create({
      ...createServicioDto,
      camionId,
      fechaServicio: new Date(createServicioDto.fechaServicio),
    });
    return this.serviciosRepository.save(servicio);
  }

  async update(id: number, updateServicioDto: UpdateServicioDto): Promise<Servicio> {
    const servicio = await this.findOne(id);
    if (updateServicioDto.fechaServicio) {
      updateServicioDto.fechaServicio = new Date(updateServicioDto.fechaServicio);
    }
    Object.assign(servicio, updateServicioDto);
    return this.serviciosRepository.save(servicio);
  }

  async remove(id: number): Promise<{ message: string }> {
    const servicio = await this.findOne(id);
    await this.serviciosRepository.remove(servicio);
    return { message: 'Servicio eliminado correctamente' };
  }
}
