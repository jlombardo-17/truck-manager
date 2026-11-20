import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Viaje } from '../viajes/viaje.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly repository: Repository<Cliente>,
  ) {}

  findAll(): Promise<Cliente[]> {
    return this.repository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number): Promise<Cliente> {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return record;
  }

  async create(dto: CreateClienteDto): Promise<Cliente> {
    const nombre = dto.nombre.trim();
    await this.assertNombreDisponible(nombre);
    const record = this.repository.create({ ...dto, nombre });
    return this.repository.save(record);
  }

  async update(id: number, dto: UpdateClienteDto): Promise<Cliente> {
    const record = await this.findOne(id);
    const nombre = dto.nombre?.trim();
    if (nombre && nombre.toLowerCase() !== record.nombre.toLowerCase()) {
      await this.assertNombreDisponible(nombre);
    }
    Object.assign(record, dto, nombre ? { nombre } : {});
    return this.repository.save(record);
  }

  async remove(id: number): Promise<{ message: string }> {
    const record = await this.findOne(id);

    const viajesAsociados = await this.repository.manager
      .getRepository(Viaje)
      .count({ where: { cliente: { id } } });

    if (viajesAsociados > 0) {
      throw new BadRequestException(
        `El cliente tiene ${viajesAsociados} viaje(s) asociado(s). Marcalo como inactivo en lugar de eliminarlo.`,
      );
    }

    await this.repository.remove(record);
    return { message: 'Cliente eliminado correctamente' };
  }

  private async assertNombreDisponible(nombre: string): Promise<void> {
    // La collation por defecto de MySQL es case-insensitive: 'calmer' = 'Calmer'
    const existente = await this.repository.findOne({ where: { nombre } });
    if (existente) {
      throw new ConflictException(`Ya existe un cliente con el nombre "${existente.nombre}"`);
    }
  }
}
