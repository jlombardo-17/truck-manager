import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Viaje } from './viaje.entity';
import { ViajRuta } from './viaje-ruta.entity';
import { ViajComision } from './viaje-comision.entity';
import { CreateViajDTO } from './dto/create-viaje.dto';
import { UpdateViajDTO } from './dto/update-viaje.dto';
import { CamionesService } from '../camiones/camiones.service';
import { Camion } from '../camiones/camion.entity';
import { Chofer } from '../choferes/chofer.entity';

type RoutePointInput = {
  orden?: number;
  latitud: number;
  longitud: number;
  direccion?: string;
  odometroKm?: number | null;
  notas?: string;
};

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
      camion: { id: createViajDTO.camionId } as Camion,
      chofer: { id: createViajDTO.choferId } as Chofer,
      fechaInicio: new Date(createViajDTO.fechaInicio),
      fechaFin: createViajDTO.fechaFin ? new Date(createViajDTO.fechaFin) : null,
      fechaPago: createViajDTO.fechaPago ? new Date(createViajDTO.fechaPago) : null,
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
          viaje: { id: savedViaje.id } as Viaje,
          ...rutaDTO,
        }),
      );
      await this.viajRutaRepository.save(rutas);
    }

    // Agregar comisiones si existen
    if (createViajDTO.comisiones && createViajDTO.comisiones.length > 0) {
      await this.guardarComisiones(
        savedViaje.id,
        savedViaje.valorViaje,
        createViajDTO.comisiones,
      );
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
    fechaPagoDesde?: Date;
    fechaPagoHasta?: Date;
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
      query = query.andWhere('viaje.camion_id = :camionId', { camionId: filters.camionId });
    }

    if (filters?.choferId) {
      query = query.andWhere('viaje.chofer_id = :choferId', { choferId: filters.choferId });
    }

    if (filters?.fechaInicio) {
      query = query.andWhere('viaje.fechaInicio >= :fechaInicio', { fechaInicio: filters.fechaInicio });
    }

    if (filters?.fechaFin) {
      query = query.andWhere('viaje.fechaFin <= :fechaFin', { fechaFin: filters.fechaFin });
    }

    if (filters?.fechaPagoDesde) {
      query = query.andWhere('viaje.fechaPago >= :fechaPagoDesde', { fechaPagoDesde: filters.fechaPagoDesde });
    }

    if (filters?.fechaPagoHasta) {
      query = query.andWhere('viaje.fechaPago <= :fechaPagoHasta', { fechaPagoHasta: filters.fechaPagoHasta });
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
    const {
      rutas,
      comisiones,
      camionId,
      choferId,
      ...viajeChanges
    } = updateViajDTO;

    // Actualizar campos
    Object.assign(viaje, {
      ...viajeChanges,
      ...(camionId ? { camion: { id: camionId } as Camion } : {}),
      ...(choferId ? { chofer: { id: choferId } as Chofer } : {}),
      fechaInicio: viajeChanges.fechaInicio ? new Date(viajeChanges.fechaInicio) : viaje.fechaInicio,
      fechaFin: viajeChanges.fechaFin ? new Date(viajeChanges.fechaFin) : viaje.fechaFin,
      fechaPago: Object.prototype.hasOwnProperty.call(viajeChanges, 'fechaPago')
        ? (viajeChanges.fechaPago ? new Date(viajeChanges.fechaPago) : null)
        : viaje.fechaPago,
    });

    await this.viajRepository.save(viaje);

    // Eliminar y recrear rutas si se proporcionan
    if (rutas) {
      await this.viajRutaRepository
        .createQueryBuilder()
        .delete()
        .from(ViajRuta)
        .where('viaje_id = :viajeId', { viajeId: id })
        .execute();

      const rutasToSave = rutas.map((rutaDTO) =>
        this.viajRutaRepository.create({
          viaje: { id } as Viaje,
          ...rutaDTO,
        }),
      );
      await this.viajRutaRepository.save(rutasToSave);
    }

    // Eliminar y recrear comisiones si se proporcionan
    if (comisiones) {
      await this.viajComisionRepository.delete({ viajeId: id });
      await this.guardarComisiones(id, viaje.valorViaje, comisiones);
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
      const camionId = viaje.camion?.id || viaje.camionId;
      const camion = await this.camionesService.findOne(camionId);
      const nuevoOdometro = Number(camion.odometroKm) + Number(viaje.kmRecorridos);
      await this.camionesService.updateOdometro(camionId, nuevoOdometro);
    }

    await this.viajRepository.save(viaje);
    return this.findOneWithRelations(id);
  }

  /**
   * Calcular ycrear una comisión
   */
  private calcularYCrearComision(viajeId: number, montoBase: number, comisionDTO: any) {
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

  private async guardarComisiones(
    viajeId: number,
    montoBase: number,
    comisionesDTO: any[],
  ): Promise<void> {
    for (const comisionDTO of comisionesDTO) {
      const comision = this.calcularYCrearComision(viajeId, montoBase, comisionDTO);

      await this.viajComisionRepository.query(
        `
          INSERT INTO viajes_comisiones (
            viajeId,
            viaje_id,
            tipo,
            concepto,
            montoBase,
            porcentaje,
            montoFijo,
            montoTotal,
            beneficiario,
            estado,
            notas,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          viajeId,
          viajeId,
          comision.tipo,
          comision.concepto ?? null,
          comision.montoBase ?? null,
          comision.porcentaje ?? null,
          comision.montoFijo ?? null,
          comision.montoTotal,
          comision.beneficiario ?? null,
          comision.estado,
          comision.notas ?? null,
        ],
      );
    }
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

  /**
   * Obtener las rutas de un viaje
   */
  async getRoutes(viajeId: number): Promise<ViajRuta[]> {
    const viaje = await this.viajRepository.findOne({
      where: { id: viajeId },
      relations: ['rutas'],
    });

    if (!viaje) {
      throw new NotFoundException(`Viaje con ID ${viajeId} no encontrado`);
    }

    return viaje.rutas || [];
  }

  /**
   * Guardar/actualizar las rutas de un viaje
   */
  async saveRoutes(
    viajeId: number,
    rutasDTO: any[],
    kmRecorridosManual?: number,
  ): Promise<ViajRuta[]> {
    // Verificar que el viaje existe
    const viaje = await this.findOne(viajeId);
    if (!viaje) {
      throw new NotFoundException(`Viaje con ID ${viajeId} no encontrado`);
    }

    // Eliminar rutas existentes
    await this.viajRutaRepository
      .createQueryBuilder()
      .delete()
      .from(ViajRuta)
      .where('viaje_id = :viajeId', { viajeId })
      .execute();

    // Mejor ruta por carretera (OSRM); si falla, usa Haversine como fallback
    const optimizedRoute = await this.getBestRoadRoute(rutasDTO);

    // Crear y guardar las nuevas rutas
    const rutas = optimizedRoute.points.map((rutaDTO, index) =>
      this.viajRutaRepository.create({
        viaje: { id: viajeId } as Viaje,
        orden: index + 1,
        latitud: rutaDTO.latitud,
        longitud: rutaDTO.longitud,
        direccion: rutaDTO.direccion,
        odometroKm: rutaDTO.odometroKm || null,
        notas: rutaDTO.notas,
      }),
    );

    await this.viajRutaRepository.save(rutas);

    // Actualizar km recorridos, priorizando el valor manual enviado desde el formulario.
    const distanciaTotal = optimizedRoute.distanceKm;
    const kmRecorridos =
      kmRecorridosManual !== undefined
        ? Math.round(kmRecorridosManual * 100) / 100
        : Math.round(distanciaTotal * 100) / 100;

    if (kmRecorridosManual !== undefined || distanciaTotal > 0) {
      await this.viajRepository.update(
        { id: viajeId },
        { kmRecorridos },
      );
    }

    return rutas.sort((a, b) => a.orden - b.orden);
  }

  /**
   * Calcula mejor ruta por carretera entre puntos marcados.
   * - 2 puntos: calcula la ruta en orden directo
   * - 3+ puntos: optimiza los intermedios (mantiene origen/destino)
   */
  private async getBestRoadRoute(
    inputPoints: RoutePointInput[],
  ): Promise<{ points: RoutePointInput[]; distanceKm: number }> {
    if (inputPoints.length < 2) {
      return {
        points: inputPoints,
        distanceKm: 0,
      };
    }

    const points = inputPoints.map((p) => ({
      ...p,
      latitud: Number(p.latitud),
      longitud: Number(p.longitud),
    }));

    const coordinates = points.map((p) => `${p.longitud},${p.latitud}`).join(';');

    try {
      if (points.length === 2) {
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&steps=false&annotations=false`;
        const response = await fetch(routeUrl);

        if (!response.ok) {
          throw new Error(`OSRM route request failed: ${response.status}`);
        }

        const data: any = await response.json();
        const distanceKm = Number(data?.routes?.[0]?.distance || 0) / 1000;

        return {
          points,
          distanceKm,
        };
      }

      const tripUrl = `https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&destination=last&roundtrip=false&overview=false&steps=false&annotations=false`;
      const response = await fetch(tripUrl);

      if (!response.ok) {
        throw new Error(`OSRM trip request failed: ${response.status}`);
      }

      const data: any = await response.json();
      const distanceKm = Number(data?.trips?.[0]?.distance || 0) / 1000;
      const waypoints = Array.isArray(data?.waypoints) ? data.waypoints : [];

      if (waypoints.length !== points.length) {
        throw new Error('OSRM waypoints length mismatch');
      }

      const optimizedPoints = waypoints
        .map((wp: any, originalIndex: number) => ({
          originalIndex,
          optimizedIndex: Number(wp?.waypoint_index),
        }))
        .sort((a, b) => a.optimizedIndex - b.optimizedIndex)
        .map((item) => points[item.originalIndex]);

      return {
        points: optimizedPoints,
        distanceKm,
      };
    } catch (error) {
      // Fallback local si OSRM no está disponible
      const fallbackDistanceKm = this.calculateTotalDistance(points);
      return {
        points,
        distanceKm: fallbackDistanceKm,
      };
    }
  }

  /**
   * Calcular distancia total usando Haversine formula
   */
  private calculateTotalDistance(rutas: any[]): number {
    if (rutas.length < 2) {
      return 0;
    }

    let total = 0;
    for (let i = 0; i < rutas.length - 1; i++) {
      total += this.haversineDistance(
        rutas[i].latitud,
        rutas[i].longitud,
        rutas[i + 1].latitud,
        rutas[i + 1].longitud,
      );
    }

    return total;
  }

  /**
   * Calcular distancia entre dos puntos usando Haversine formula
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
