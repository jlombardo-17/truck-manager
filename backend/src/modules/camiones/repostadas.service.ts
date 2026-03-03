import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repostada } from './repostada.entity';
import { CreateRepostadaDto, UpdateRepostadaDto } from './dto/repostada.dto';

@Injectable()
export class RepostadasService {
  constructor(
    @InjectRepository(Repostada)
    private repostadasRepository: Repository<Repostada>,
  ) {}

  async findByCamion(camionId: number): Promise<Repostada[]> {
    return this.repostadasRepository.find({
      where: { camionId },
      order: { fechaRepostada: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Repostada> {
    return this.repostadasRepository.findOne({ where: { id } });
  }

  async create(camionId: number, createRepostadaDto: CreateRepostadaDto): Promise<Repostada> {
    const repostada = this.repostadasRepository.create({
      ...createRepostadaDto,
      camionId,
    });
    return this.repostadasRepository.save(repostada);
  }

  async update(id: number, updateRepostadaDto: UpdateRepostadaDto): Promise<Repostada> {
    await this.repostadasRepository.update(id, updateRepostadaDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repostadasRepository.delete(id);
  }

  async getEstadisticas(camionId: number) {
    const repostadas = await this.findByCamion(camionId);
    
    if (repostadas.length === 0) {
      return {
        totalRepostadas: 0,
        kmPromedio: 0,
        consumoPromedio: 0,
        costoPromedio: 0,
        totalCosto: 0,
        totalLitros: 0,
        totalKm: 0,
      };
    }

    const totalKm = repostadas.reduce((sum, r) => sum + r.kmRecorridos, 0);
    const totalLitros = repostadas.reduce((sum, r) => sum + parseFloat(r.litros.toString()), 0);
    const totalCosto = repostadas.reduce((sum, r) => sum + (r.costo || 0), 0);

    return {
      totalRepostadas: repostadas.length,
      kmPromedio: totalKm / repostadas.length,
      consumoPromedio: totalLitros / repostadas.length,
      costoPromedio: totalCosto / repostadas.length,
      totalCosto,
      totalLitros,
      totalKm,
    };
  }
}
