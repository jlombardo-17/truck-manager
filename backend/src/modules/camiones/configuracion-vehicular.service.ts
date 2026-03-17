import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionVehicular, SeccionVehicularData } from './configuracion-vehicular.entity';
import { UpsertConfiguracionVehicularDto } from './dto/configuracion-vehicular.dto';

@Injectable()
export class ConfiguracionVehicularService {
  constructor(
    @InjectRepository(ConfiguracionVehicular)
    private readonly repo: Repository<ConfiguracionVehicular>,
  ) {}

  findByCamion(camionId: number): Promise<ConfiguracionVehicular | null> {
    return this.repo.findOne({ where: { camionId } });
  }

  async upsert(
    camionId: number,
    dto: UpsertConfiguracionVehicularDto,
  ): Promise<ConfiguracionVehicular> {
    const secciones = dto.secciones as unknown as SeccionVehicularData[];
    const existing = await this.repo.findOne({ where: { camionId } });
    if (existing) {
      existing.tipoCombinacion = dto.tipoCombinacion;
      existing.secciones = secciones;
      existing.notas = dto.notas;
      return this.repo.save(existing);
    }
    const config = this.repo.create({ camionId, tipoCombinacion: dto.tipoCombinacion, secciones, notas: dto.notas });
    return this.repo.save(config);
  }

  async remove(camionId: number): Promise<void> {
    const existing = await this.repo.findOne({ where: { camionId } });
    if (existing) {
      await this.repo.remove(existing);
    }
  }
}
