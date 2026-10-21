import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GastoFijo } from './gasto-fijo.entity';
import { CreateGastoFijoDto, UpdateGastoFijoDto } from './dto/gasto-fijo.dto';

@Injectable()
export class GastosFijosService {
  constructor(
    @InjectRepository(GastoFijo)
    private readonly gastosFijosRepository: Repository<GastoFijo>,
  ) {}

  findByCamion(camionId: number): Promise<GastoFijo[]> {
    return this.gastosFijosRepository.find({
      where: { camionId },
      order: { vigenciaDesde: 'DESC' },
    });
  }

  async findOne(id: number): Promise<GastoFijo> {
    const gastoFijo = await this.gastosFijosRepository.findOne({ where: { id } });
    if (!gastoFijo) {
      throw new NotFoundException('Gasto fijo no encontrado');
    }
    return gastoFijo;
  }

  create(camionId: number, createGastoFijoDto: CreateGastoFijoDto): Promise<GastoFijo> {
    const gastoFijo = this.gastosFijosRepository.create({
      ...createGastoFijoDto,
      camionId,
    });
    return this.gastosFijosRepository.save(gastoFijo);
  }

  async update(id: number, updateGastoFijoDto: UpdateGastoFijoDto): Promise<GastoFijo> {
    const gastoFijo = await this.findOne(id);
    Object.assign(gastoFijo, updateGastoFijoDto);
    return this.gastosFijosRepository.save(gastoFijo);
  }

  async remove(id: number): Promise<{ message: string }> {
    const gastoFijo = await this.findOne(id);
    await this.gastosFijosRepository.remove(gastoFijo);
    return { message: 'Gasto fijo eliminado correctamente' };
  }
}
