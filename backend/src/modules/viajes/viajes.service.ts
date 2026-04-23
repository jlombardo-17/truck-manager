import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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

type ViajeCurrency = 'UYU' | 'USD';

@Injectable()
export class ViajsService {
  private readonly logger = new Logger(ViajsService.name);
  private usdUyuRateCache: { rate: number; fetchedAtMs: number } | null = null;

  private getConfiguredUsdToUyuRate(): number {
    const parsed = Number(process.env.USD_TO_UYU_RATE);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 40;
  }

  private normalizeCurrency(value?: string): ViajeCurrency {
    if ((value || '').toUpperCase() === 'USD') return 'USD';
    return 'UYU';
  }

  private roundToTwo(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async getUsdUyuRateInfo(): Promise<{ rate: number; source: string; fetchedAt: string }> {
    const nowMs = Date.now();

    if (this.usdUyuRateCache && nowMs - this.usdUyuRateCache.fetchedAtMs < 15 * 60 * 1000) {
      return {
        rate: this.usdUyuRateCache.rate,
        source: 'cache',
        fetchedAt: new Date(this.usdUyuRateCache.fetchedAtMs).toISOString(),
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json() as { rates?: Record<string, unknown> };
      const rate = Number(payload?.rates?.UYU);
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error('Tipo de cambio UYU inválido en la respuesta externa');
      }

      this.usdUyuRateCache = { rate, fetchedAtMs: nowMs };

      return {
        rate,
        source: 'open.er-api.com',
        fetchedAt: new Date(nowMs).toISOString(),
      };
    } catch (error) {
      const fallbackRate = this.getConfiguredUsdToUyuRate();
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo obtener cotización online USD/UYU (${message}). Se usa fallback=${fallbackRate}`);
      return {
        rate: fallbackRate,
        source: 'fallback-env',
        fetchedAt: new Date(nowMs).toISOString(),
      };
    }
  }

  private toUyuAmount(value: unknown, currency: ViajeCurrency, usdUyuRate: number): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (currency === 'USD') {
      return this.roundToTwo(parsed * usdUyuRate);
    }
    return this.roundToTwo(parsed);
  }

  private normalizeComisionesToUyu(
    comisiones: any[] | undefined,
    currency: ViajeCurrency,
    usdUyuRate: number,
  ): any[] | undefined {
    if (!Array.isArray(comisiones)) {
      return comisiones;
    }

    return comisiones.map((comision) => ({
      ...comision,
      montoBase: this.toUyuAmount(comision?.montoBase, currency, usdUyuRate) ?? comision?.montoBase,
      montoFijo: this.toUyuAmount(comision?.montoFijo, currency, usdUyuRate) ?? comision?.montoFijo,
    }));
  }

  async getUsdUyuRate() {
    return this.getUsdUyuRateInfo();
  }

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
    try {
      await this.assertCamionExists(createViajDTO.camionId);
      await this.assertChoferExists(createViajDTO.choferId);

      const requestedCurrency = this.normalizeCurrency(createViajDTO.moneda);
      const rateInfo = requestedCurrency === 'USD' ? await this.getUsdUyuRateInfo() : null;
      const usdUyuRate = rateInfo?.rate ?? 1;
      const valorViajeOriginal = Number(createViajDTO.valorViaje) || 0;
      const valorViajeUyu =
        this.toUyuAmount(valorViajeOriginal, requestedCurrency, usdUyuRate) ?? 0;
      const comisionesNormalized = this.normalizeComisionesToUyu(
        createViajDTO.comisiones,
        requestedCurrency,
        usdUyuRate,
      );

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
        documentoDescarga: createViajDTO.documentoDescarga,
        documentoDescargaNombre: createViajDTO.documentoDescargaNombre,
        documentoDescargaAdjunto: createViajDTO.documentoDescargaAdjunto,
        pesoCargaKg: createViajDTO.pesoCargaKg as any || null,
        valorViaje: valorViajeOriginal,
        valorViajeUyu,
        moneda: requestedCurrency,
        cotizacionUsdUyu: requestedCurrency === 'USD' ? usdUyuRate : null,
        kmRecorridos: createViajDTO.kmRecorridos as any || 0,
        consumoCombustible: createViajDTO.consumoCombustible as any || null,
        costoCombustible: createViajDTO.costoCombustible as any || 0,
        otrosGastos: createViajDTO.otrosGastos as any || 0,
        estado: createViajDTO.estado || 'en_progreso',
        notas: createViajDTO.notas,
      });

      const savedViaje = await this.viajRepository.save(viaje);

      if (createViajDTO.rutas && createViajDTO.rutas.length > 0) {
        const rutas = this.normalizeRoutePoints(createViajDTO.rutas).map((rutaDTO) =>
          this.viajRutaRepository.create({
            viaje: { id: savedViaje.id } as Viaje,
            ...rutaDTO,
          }),
        );
        await this.viajRutaRepository.save(rutas);
      }

      if (comisionesNormalized && comisionesNormalized.length > 0) {
        await this.guardarComisiones(
          savedViaje.id,
          savedViaje.valorViajeUyu,
          comisionesNormalized,
        );
      }

      return this.findOneWithRelations(savedViaje.id);
    } catch (error) {
      this.logger.error(
        `Error creating viaje numeroViaje=${createViajDTO.numeroViaje}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('No se pudo crear el viaje');
    }
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

    const viajes = await query.getMany();
    return viajes.map((viaje) => this.withResolvedRelationIds(viaje));
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

    return this.withResolvedRelationIds(viaje);
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

  private withResolvedRelationIds(viaje: Viaje): Viaje {
    if (!viaje) {
      return viaje;
    }

    if (!viaje.camionId && viaje.camion?.id) {
      viaje.camionId = viaje.camion.id;
    }

    if (!viaje.choferId && viaje.chofer?.id) {
      viaje.choferId = viaje.chofer.id;
    }

    return viaje;
  }

  /**
   * Actualizar un viaje
   */
  async update(id: number, updateViajDTO: UpdateViajDTO): Promise<Viaje> {
    try {
      const viaje = await this.findOne(id);
      const {
        rutas,
        comisiones,
        camionId,
        choferId,
        valorViaje,
        moneda,
        ...viajeChanges
      } = updateViajDTO;

      const hasCurrencyChange = Object.prototype.hasOwnProperty.call(updateViajDTO, 'moneda');
      const hasAmountChange = Object.prototype.hasOwnProperty.call(updateViajDTO, 'valorViaje');
      const effectiveCurrency = this.normalizeCurrency(moneda ?? viaje.moneda);

      const shouldResolveRate = effectiveCurrency === 'USD' && (hasCurrencyChange || hasAmountChange || Boolean(comisiones));
      const rateInfo = shouldResolveRate ? await this.getUsdUyuRateInfo() : null;
      const usdUyuRate = rateInfo?.rate || Number(viaje.cotizacionUsdUyu) || 1;

      const nextOriginalAmount = hasAmountChange
        ? Number(valorViaje)
        : Number(viaje.valorViaje);

      const nextValorViajeUyu =
        this.toUyuAmount(nextOriginalAmount, effectiveCurrency, usdUyuRate) ?? Number(viaje.valorViajeUyu || viaje.valorViaje || 0);

      const comisionesNormalized = this.normalizeComisionesToUyu(
        comisiones,
        effectiveCurrency,
        usdUyuRate,
      );

      if (camionId) {
        await this.assertCamionExists(camionId);
      }

      if (choferId) {
        await this.assertChoferExists(choferId);
      }

      Object.assign(viaje, {
        ...viajeChanges,
        ...(camionId ? { camion: { id: camionId } as Camion } : {}),
        ...(choferId ? { chofer: { id: choferId } as Chofer } : {}),
        ...(hasAmountChange || hasCurrencyChange
          ? {
              valorViaje: Number.isFinite(nextOriginalAmount) ? nextOriginalAmount : Number(viaje.valorViaje),
              valorViajeUyu: nextValorViajeUyu,
              moneda: effectiveCurrency,
              cotizacionUsdUyu: effectiveCurrency === 'USD' ? usdUyuRate : null,
            }
          : {}),
        fechaInicio: viajeChanges.fechaInicio ? new Date(viajeChanges.fechaInicio) : viaje.fechaInicio,
        fechaFin: viajeChanges.fechaFin ? new Date(viajeChanges.fechaFin) : viaje.fechaFin,
        fechaPago: Object.prototype.hasOwnProperty.call(viajeChanges, 'fechaPago')
          ? (viajeChanges.fechaPago ? new Date(viajeChanges.fechaPago) : null)
          : viaje.fechaPago,
      });

      await this.viajRepository.save(viaje);

      if (rutas) {
        const normalizedRutas = this.normalizeRoutePoints(rutas);

        await this.viajRutaRepository
          .createQueryBuilder()
          .delete()
          .from(ViajRuta)
          .where('viaje_id = :viajeId', { viajeId: id })
          .execute();

        const rutasToSave = normalizedRutas.map((rutaDTO) =>
          this.viajRutaRepository.create({
            viaje: { id } as Viaje,
            ...rutaDTO,
          }),
        );
        await this.viajRutaRepository.save(rutasToSave);
      }

      if (comisionesNormalized) {
        await this.viajComisionRepository.delete({ viajeId: id });
        const baseMontoParaComisiones = Number(
          (hasAmountChange || hasCurrencyChange ? nextValorViajeUyu : viaje.valorViajeUyu) || viaje.valorViaje,
        );
        await this.guardarComisiones(id, baseMontoParaComisiones, comisionesNormalized);
      }

      return this.findOneWithRelations(id);
    } catch (error) {
      this.logger.error(
        `Error updating viaje id=${id}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('No se pudo actualizar el viaje');
    }
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
    try {
      const viaje = await this.findOne(viajeId);
      if (!viaje) {
        throw new NotFoundException(`Viaje con ID ${viajeId} no encontrado`);
      }

      const normalizedRutas = this.normalizeRoutePoints(rutasDTO);

      await this.viajRutaRepository
        .createQueryBuilder()
        .delete()
        .from(ViajRuta)
        .where('viaje_id = :viajeId', { viajeId })
        .execute();

      const optimizedRoute = await this.getBestRoadRoute(normalizedRutas);

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
    } catch (error) {
      this.logger.error(
        `Error saving routes for viaje id=${viajeId}; routeCount=${Array.isArray(rutasDTO) ? rutasDTO.length : 0}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('No se pudieron guardar las rutas del viaje');
    }
  }

  private async assertCamionExists(camionId: number): Promise<void> {
    const camion = await this.camionesService.findOne(camionId);
    if (!camion) {
      throw new BadRequestException('Camión no encontrado');
    }
  }

  private async assertChoferExists(choferId: number): Promise<void> {
    const chofer = await this.viajRepository.manager.getRepository(Chofer).findOne({
      where: { id: choferId },
    });

    if (!chofer) {
      throw new BadRequestException('Chofer no encontrado');
    }
  }

  private normalizeRoutePoints(inputPoints: RoutePointInput[]): RoutePointInput[] {
    if (!Array.isArray(inputPoints)) {
      throw new BadRequestException('Las rutas deben enviarse como un arreglo');
    }

    return inputPoints.map((point, index) => {
      const latitud = Number(point?.latitud);
      const longitud = Number(point?.longitud);
      const rawOdometroKm = (point as { odometroKm?: unknown })?.odometroKm;
      const odometroKm =
        rawOdometroKm === undefined || rawOdometroKm === null || rawOdometroKm === ''
          ? null
          : Number(rawOdometroKm);

      if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
        throw new BadRequestException(`Ruta inválida en posición ${index + 1}`);
      }

      if (odometroKm !== null && !Number.isFinite(odometroKm)) {
        throw new BadRequestException(`Odómetro inválido en ruta ${index + 1}`);
      }

      return {
        orden: Number(point?.orden) || index + 1,
        latitud,
        longitud,
        direccion: point?.direccion,
        odometroKm,
        notas: point?.notas,
      };
    });
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
