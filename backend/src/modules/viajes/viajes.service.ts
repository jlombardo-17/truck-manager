import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viaje } from './viaje.entity';
import { ViajRuta } from './viaje-ruta.entity';
import { ViajComision } from './viaje-comision.entity';
import { CreateViajDTO } from './dto/create-viaje.dto';
import { UpdateViajDTO } from './dto/update-viaje.dto';
import { CamionesService } from '../camiones/camiones.service';

@Injectable()
export class ViajsService {
  constructor(
    @InjectRepository(Viaje)
    private viajRepository: Repository<Viaje>,
    @InjectRepository(ViajRuta)
    private viajRutaRepository: Repository<ViajRuta>,
    @InjectRepository(ViajComision)
    private viajComisionRepository: Repository<ViajComision>,
    private camionesService: CamionesService,
  ) {}

  /**
   * Crear un nuevo viaje
   */
  async create(createViajDTO: CreateViajDTO): Promise<Viaje> {
    // Validar que camión y chofer existan
    const camion = await this.camionesService.findOne(createViajDTO.camionId);
    if (!camion) {
      throw new BadRequestException('Camión no encontrado');
    }

    // Crear el viaje
    const viaje = this.viajRepository.create({
      numeroViaje: createViajDTO.numeroViaje,
      camionId: createViajDTO.camionId,
      choferId: createViajDTO.choferId,
      fechaInicio: new Date(createViajDTO.fechaInicio),
      fechaFin: createViajDTO.fechaFin ? new Date(createViajDTO.fechaFin) : null,
      origen: createViajDTO.origen,
      destino: createViajDTO.destino,
      latitudOrigen: createViajDTO.latitudOrigen as any || null,
      longitudOrigen: createViajDTO.longitudOrigen as any || null,
      latitudDestino: createViajDTO.latitudDestino as any || null,
      longitudDestino: createViajDTO.longitudDestino as any || null,
      descripcionCarga: createViajDTO.descripcionCarga,
      pesoCargaKg: createViajDTO.pesoCargaKg as any || null,
      valorViaje: createViajDTO.valorViaje,
      kmRecorridos: createViajDTO.kmRecorridos as any || 0,
      consumoCombustible: createViajDTO.consumoCombustible as any || null,
      costoCombustible: createViajDTO.costoCombustible as any || 0,
      otrosGastos: createViajDTO.otrosGastos as any || 0,
      notas: createViajDTO.notas,
    });

    // Guardar el viaje
    const savedViaje = await this.viajRepository.save(viaje);

    // Agregar rutas si existen
    if (createViajDTO.rutas && createViajDTO.rutas.length > 0) {
      const rutas = createViajDTO.rutas.map((rutaDTO) =>
        this.viajRutaRepository.create({
          viajeId: savedViaje.id,
          ...rutaDTO,
        }),
      );
      await this.viajRutaRepository.save(rutas);
    }

    // Agregar comisiones si existen
    if (createViajDTO.comisiones && createViajDTO.comisiones.length > 0) {
      const comisiones = createViajDTO.comisiones.map((comisionDTO) =>
        this.calcularYCrearComision(savedViaje.id, savedViaje.valorViaje, comisionDTO),
      );
      await this.viajComisionRepository.save(comisiones);
    }

    // Retornar el viaje completo con relaciones
    return this.findOneWithRelations(savedViaje.id);
  }

  /**
   * Obtener todos los viajes con filtros opcionales
   */
  async findAll(filters?: {
    estado?: string;
    camionId?: number;
    choferId?: number;
    fechaInicio?: Date;
    fechaFin?: Date;
  }): Promise<Viaje[]> {
    let query = this.viajRepository.createQueryBuilder('viaje')
      .leftJoinAndSelect('viaje.camion', 'camion')
      .leftJoinAndSelect('viaje.chofer', 'chofer')
      .leftJoinAndSelect('viaje.rutas', 'rutas')
      .leftJoinAndSelect('viaje.comisiones', 'comisiones')
      .orderBy('viaje.fechaInicio', 'DESC');

    if (filters?.estado) {
      query = query.where('viaje.estado = :estado', { estado: filters.estado });
    }

    if (filters?.camionId) {
      query = query.andWhere('viaje.camionId = :camionId', { camionId: filters.camionId });
    }

    if (filters?.choferId) {
      query = query.andWhere('viaje.choferId = :choferId', { choferId: filters.choferId });
    }

    if (filters?.fechaInicio) {
      query = query.andWhere('viaje.fechaInicio >= :fechaInicio', { fechaInicio: filters.fechaInicio });
    }

    if (filters?.fechaFin) {
      query = query.andWhere('viaje.fechaFin <= :fechaFin', { fechaFin: filters.fechaFin });
    }

    return query.getMany();
  }

  /**
   * Obtener un viaje por ID con todas sus relaciones
   */
  async findOneWithRelations(id: number): Promise<Viaje> {
    const viaje = await this.viajRepository.findOne({
      where: { id },
      relations: ['camion', 'chofer', 'rutas', 'comisiones'],
    });

    if (!viaje) {
      throw new NotFoundException(`Viaje con ID ${id} no encontrado`);
    }

    return viaje;
  }

  /**
   * Obtener un viaje por ID
   */
  async findOne(id: number): Promise<Viaje> {
    const viaje = await this.viajRepository.findOne({ where: { id } });
    if (!viaje) {
      throw new NotFoundException(`Viaje con ID ${id} no encontrado`);
    }
    return viaje;
  }

  /**
   * Actualizar un viaje
   */
  async update(id: number, updateViajDTO: UpdateViajDTO): Promise<Viaje> {
    const viaje = await this.findOne(id);

    // Actualizar campos
    Object.assign(viaje, {
      ...updateViajDTO,
      fechaInicio: updateViajDTO.fechaInicio ? new Date(updateViajDTO.fechaInicio) : viaje.fechaInicio,
      fechaFin: updateViajDTO.fechaFin ? new Date(updateViajDTO.fechaFin) : viaje.fechaFin,
    });

    await this.viajRepository.save(viaje);

    // Eliminar y recrear rutas si se proporcionan
    if (updateViajDTO.rutas) {
      await this.viajRutaRepository.delete({ viajeId: id });
      const rutas = updateViajDTO.rutas.map((rutaDTO) =>
        this.viajRutaRepository.create({
          viajeId: id,
          ...rutaDTO,
        }),
      );
      await this.viajRutaRepository.save(rutas);
    }

    // Eliminar y recrear comisiones si se proporcionan
    if (updateViajDTO.comisiones) {
      await this.viajComisionRepository.delete({ viajeId: id });
      const comisiones = updateViajDTO.comisiones.map((comisionDTO) =>
        this.calcularYCrearComision(id, viaje.valorViaje, comisionDTO),
      );
      await this.viajComisionRepository.save(comisiones);
    }

    return this.findOneWithRelations(id);
  }

  /**
   * Eliminar un viaje
   */
  async remove(id: number): Promise<void> {
    const viaje = await this.findOne(id);
    await this.viajRepository.remove(viaje);
  }

  /**
   * Cambiar estado de un viaje
   */
  async cambiarEstado(id: number, estado: string): Promise<Viaje> {
    const viaje = await this.findOne(id);
    viaje.estado = estado;

    // Si se completa el viaje, actualizar el odómetro del camión
    if (estado === 'completado' && viaje.kmRecorridos > 0) {
      const camion = await this.camionesService.findOne(viaje.camionId);
      const nuevoOdometro = Number(camion.odometroKm) + Number(viaje.kmRecorridos);
      await this.camionesService.updateOdometro(viaje.camionId, nuevoOdometro);
    }

    await this.viajRepository.save(viaje);
    return this.findOneWithRelations(id);
  }

  /**
   * Calcular ycrear una comisión
   */
  private calcularYCrearComision(viajeId: number, montoBase: number, comisionDTO: any): any {
    let montoTotal = 0;

    // Calcular monto total
    if (comisionDTO.montoFijo) {
      montoTotal = comisionDTO.montoFijo;
    } else if (comisionDTO.porcentaje && comisionDTO.montoBase) {
      montoTotal = (comisionDTO.montoBase * comisionDTO.porcentaje) / 100;
    } else if (comisionDTO.porcentaje) {
      // Si no hay montoBase especificado, usar el montoBase del viaje
      montoTotal = (montoBase * comisionDTO.porcentaje) / 100;
    }

    return {
      viajeId,
      ...comisionDTO,
      montoTotal: Math.round(montoTotal * 100) / 100, // Redondear a 2 decimales
      estado: comisionDTO.estado || 'pendiente',
    };
  }

  /**
   * Obtener todas las comisiones de un viaje
   */
  async getComisiones(viajeId: number): Promise<ViajComision[]> {
    return this.viajComisionRepository.find({
      where: { viajeId },
    });
  }

  /**
   * Obtener el desglose económico de un viaje (ganancia neta)
   */
  async getDesglose(viajeId: number): Promise<{
    valorViaje: number;
    costoCombustible: number;
    otrosGastos: number;
    totalComisiones: number;
    gananciaNeta: number;
  }> {
    const viaje = await this.findOne(viajeId);
    const comisiones = await this.getComisiones(viajeId);

    const totalComisiones = comisiones.reduce(
      (sum, com) => sum + Number(com.montoTotal),
      0,
    );

    const costosOperacionales = Number(viaje.costoCombustible) + Number(viaje.otrosGastos);

    return {
      valorViaje: Number(viaje.valorViaje),
      costoCombustible: Number(viaje.costoCombustible),
      otrosGastos: Number(viaje.otrosGastos),
      totalComisiones,
      gananciaNeta: Number(viaje.valorViaje) - costosOperacionales - totalComisiones,
    };
  }
}
