import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Viaje } from './viaje.entity';
import { ViajRuta } from './viaje-ruta.entity';
import { ViajComision, esComisionOperario, esGastoOperativo } from './viaje-comision.entity';
import { CreateViajDTO } from './dto/create-viaje.dto';
import { UpdateViajDTO } from './dto/update-viaje.dto';
import { CamionesService } from '../camiones/camiones.service';
import { Camion } from '../camiones/camion.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Cliente } from '../clientes/cliente.entity';
import { getUsdUyuRateInfo, UsdUyuRateInfo } from '../../common/utils/usd-uyu-rate';
import { getPrecioGasoilInfo, PrecioGasoilInfo } from '../../common/utils/precio-gasoil';
import { JornadasService } from '../jornadas/jornadas.service';
import { parseDateOnly, rangoFechaViaje } from '../../common/utils/date-only';

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

  private normalizeCurrency(value?: string): ViajeCurrency {
    if ((value || '').toUpperCase() === 'USD') return 'USD';
    return 'UYU';
  }

  private roundToTwo(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private getUsdUyuRateInfo(): Promise<UsdUyuRateInfo> {
    return getUsdUyuRateInfo();
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

  private comisionCurrency(comision: { moneda?: string } | undefined): ViajeCurrency {
    return comision?.moneda === 'USD' ? 'USD' : 'UYU';
  }

  private hasUsdComision(comisiones: any[] | undefined): boolean {
    return Array.isArray(comisiones) && comisiones.some((c) => this.comisionCurrency(c) === 'USD');
  }

  async getUsdUyuRate() {
    return this.getUsdUyuRateInfo();
  }

  /** Precio del litro de gasoil 50-S (ANCAP) vigente en `fecha` (YYYY-MM-DD, default hoy). */
  async getPrecioGasoil(fecha?: string): Promise<PrecioGasoilInfo> {
    return getPrecioGasoilInfo(fecha);
  }

  constructor(
    @InjectRepository(Viaje)
    private viajRepository: Repository<Viaje>,
    @InjectRepository(ViajRuta)
    private viajRutaRepository: Repository<ViajRuta>,
    @InjectRepository(ViajComision)
    private viajComisionRepository: Repository<ViajComision>,
    private camionesService: CamionesService,
    private jornadasService: JornadasService,
  ) {}

  /**
   * Crear un nuevo viaje
   */
  async create(createViajDTO: CreateViajDTO): Promise<Viaje> {
    try {
      await this.assertCamionExists(createViajDTO.camionId);
      await this.assertChoferExists(createViajDTO.choferId, { requireActivo: true });
      if (createViajDTO.clienteId) {
        await this.assertClienteExists(createViajDTO.clienteId);
      }
      const comisionesCreate = await this.resolverChoferesOperario(createViajDTO.comisiones);

      const requestedCurrency = this.normalizeCurrency(createViajDTO.moneda);
      const needsRate =
        requestedCurrency === 'USD' || this.hasUsdComision(createViajDTO.comisiones);
      const rateInfo = needsRate ? await this.getUsdUyuRateInfo() : null;
      const usdUyuRate = rateInfo?.rate ?? 1;
      const valorViajeOriginal = Number(createViajDTO.valorViaje) || 0;
      const valorViajeUyu =
        this.toUyuAmount(valorViajeOriginal, requestedCurrency, usdUyuRate) ?? 0;

      const viaje = this.viajRepository.create({
        numeroViaje: createViajDTO.numeroViaje,
        camion: { id: createViajDTO.camionId } as Camion,
        chofer: { id: createViajDTO.choferId } as Chofer,
        cliente: createViajDTO.clienteId ? ({ id: createViajDTO.clienteId } as Cliente) : null,
        fechaInicio: new Date(createViajDTO.fechaInicio),
        fechaFin: createViajDTO.fechaFin ? new Date(createViajDTO.fechaFin) : null,
        fechaPago: createViajDTO.fechaPago || null,
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
        documentosDescargaAdjuntos: createViajDTO.documentosDescargaAdjuntos ?? null,
        pesoCargaKg: createViajDTO.pesoCargaKg as any || null,
        tarifaPorTonelada: createViajDTO.tarifaPorTonelada ?? null,
        monedaTarifa:
          createViajDTO.tarifaPorTonelada != null ? createViajDTO.monedaTarifa || 'UYU' : null,
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

      if (comisionesCreate && comisionesCreate.length > 0) {
        await this.guardarComisiones(
          savedViaje.id,
          savedViaje.valorViajeUyu,
          comisionesCreate,
          usdUyuRate,
        );
      }

      // Comisiones tipo "Chofer" y "Operario" → jornadas y salario del chofer que las cobra
      await this.jornadasService.sincronizarComisionesViaje(savedViaje.id);

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
    clienteId?: number;
    fechaDesde?: string; // YYYY-MM-DD, sobre fechaInicio
    fechaHasta?: string; // YYYY-MM-DD, sobre fechaInicio (inclusive)
  }): Promise<Viaje[]> {
    let query = this.viajRepository.createQueryBuilder('viaje')
      .leftJoinAndSelect('viaje.camion', 'camion')
      .leftJoinAndSelect('viaje.chofer', 'chofer')
      .leftJoinAndSelect('viaje.cliente', 'cliente')
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

    if (filters?.clienteId) {
      query = query.andWhere('viaje.cliente_id = :clienteId', { clienteId: filters.clienteId });
    }

    // fechaInicio es fecha de viaje (día UTC): los límites se arman con rangoFechaViaje
    if (filters?.fechaDesde) {
      const { desde } = rangoFechaViaje(parseDateOnly(filters.fechaDesde), parseDateOnly(filters.fechaDesde));
      query = query.andWhere('viaje.fechaInicio >= :fechaDesde', { fechaDesde: desde });
    }

    if (filters?.fechaHasta) {
      const { hasta } = rangoFechaViaje(parseDateOnly(filters.fechaHasta), parseDateOnly(filters.fechaHasta));
      query = query.andWhere('viaje.fechaInicio <= :fechaHasta', { fechaHasta: hasta });
    }

    const viajes = await query.getMany();
    return viajes.map((viaje) => this.withDocumentosDescarga(this.withResolvedRelationIds(viaje)));
  }

  /**
   * Obtener un viaje por ID con todas sus relaciones
   */
  async findOneWithRelations(id: number): Promise<Viaje> {
    const viaje = await this.viajRepository.findOne({
      where: { id },
      relations: ['camion', 'chofer', 'cliente', 'rutas', 'comisiones'],
    });

    if (!viaje) {
      throw new NotFoundException(`Viaje con ID ${id} no encontrado`);
    }

    return this.withDocumentosDescarga(this.withResolvedRelationIds(viaje));
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

    if (!viaje.clienteId && viaje.cliente?.id) {
      viaje.clienteId = viaje.cliente.id;
    }

    return viaje;
  }

  /**
   * Viajes anteriores guardaban un único adjunto en documentoDescargaAdjunto:
   * se expone dentro de la lista para que el cliente trabaje solo con el array.
   */
  private withDocumentosDescarga(viaje: Viaje): Viaje {
    if (!viaje) {
      return viaje;
    }

    const documentos = Array.isArray(viaje.documentosDescargaAdjuntos)
      ? viaje.documentosDescargaAdjuntos
      : [];

    if (documentos.length === 0 && viaje.documentoDescargaAdjunto) {
      viaje.documentosDescargaAdjuntos = [
        {
          nombre: viaje.documentoDescargaNombre || 'documento-descarga',
          adjunto: viaje.documentoDescargaAdjunto,
        },
      ];
    } else {
      viaje.documentosDescargaAdjuntos = documentos;
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
        clienteId,
        valorViaje,
        moneda,
        ...viajeChanges
      } = updateViajDTO;
      const hasClienteChange = Object.prototype.hasOwnProperty.call(updateViajDTO, 'clienteId');

      const hasCurrencyChange = Object.prototype.hasOwnProperty.call(updateViajDTO, 'moneda');
      const hasAmountChange = Object.prototype.hasOwnProperty.call(updateViajDTO, 'valorViaje');
      const effectiveCurrency = this.normalizeCurrency(moneda ?? viaje.moneda);

      const shouldResolveRate =
        (effectiveCurrency === 'USD' && (hasCurrencyChange || hasAmountChange || Boolean(comisiones))) ||
        this.hasUsdComision(comisiones);
      const rateInfo = shouldResolveRate ? await this.getUsdUyuRateInfo() : null;
      const usdUyuRate = rateInfo?.rate || Number(viaje.cotizacionUsdUyu) || 1;

      const nextOriginalAmount = hasAmountChange
        ? Number(valorViaje)
        : Number(viaje.valorViaje);

      const nextValorViajeUyu =
        this.toUyuAmount(nextOriginalAmount, effectiveCurrency, usdUyuRate) ?? Number(viaje.valorViajeUyu || viaje.valorViaje || 0);

      if (camionId) {
        await this.assertCamionExists(camionId);
      }

      if (choferId) {
        // Solo exigir chofer activo si se está reasignando; permite editar viajes
        // históricos cuyo chofer quedó inactivo después.
        const currentChoferId = viaje.choferId ?? viaje.chofer?.id;
        await this.assertChoferExists(choferId, {
          requireActivo: Number(choferId) !== Number(currentChoferId),
        });
      }

      if (clienteId) {
        await this.assertClienteExists(clienteId);
      }
      const comisionesUpdate = await this.resolverChoferesOperario(comisiones);

      Object.assign(viaje, {
        ...viajeChanges,
        ...(camionId ? { camion: { id: camionId } as Camion } : {}),
        ...(choferId ? { chofer: { id: choferId } as Chofer } : {}),
        ...(hasClienteChange ? { cliente: clienteId ? ({ id: clienteId } as Cliente) : null } : {}),
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
          ? (viajeChanges.fechaPago || null)
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

      if (comisiones) {
        await this.viajComisionRepository.delete({ viajeId: id });
        const baseMontoParaComisiones = Number(
          (hasAmountChange || hasCurrencyChange ? nextValorViajeUyu : viaje.valorViajeUyu) || viaje.valorViaje,
        );
        await this.guardarComisiones(id, baseMontoParaComisiones, comisionesUpdate, usdUyuRate);
      }

      // Puede haber cambiado el chofer, la fecha, el estado o las comisiones
      await this.jornadasService.sincronizarComisionesViaje(id);

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
    // Quita las comisiones que el viaje generó en las jornadas y recalcula los salarios
    await this.jornadasService.sincronizarComisionesViaje(id, { eliminar: true });
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
    // Un viaje cancelado deja de sumar comisiones al chofer (y vuelve a sumar si se reactiva)
    await this.jornadasService.sincronizarComisionesViaje(id);
    return this.findOneWithRelations(id);
  }

  /** Re-sincroniza las comisiones de chofer de todos los viajes con las jornadas (migración / reparación). */
  async sincronizarComisionesChofer() {
    return this.jornadasService.sincronizarTodasLasComisionesDeViajes();
  }

  /**
   * Calcular ycrear una comisión
   */
  /**
   * montoFijo y montoBase se guardan tal cual, en la moneda de la comisión.
   * montoTotal siempre en UYU: es lo que suman reportes, dashboard y salarios.
   */
  private calcularYCrearComision(
    viajeId: number,
    valorViajeUyu: number,
    comisionDTO: any,
    usdUyuRate: number,
  ) {
    const moneda = this.comisionCurrency(comisionDTO);
    const montoFijo = Number(comisionDTO.montoFijo) || 0;
    const montoBase = Number(comisionDTO.montoBase) || 0;
    const porcentaje = Number(comisionDTO.porcentaje) || 0;
    let montoTotalUyu = 0;

    if (montoFijo > 0) {
      montoTotalUyu = this.toUyuAmount(montoFijo, moneda, usdUyuRate) ?? 0;
    } else if (porcentaje > 0 && montoBase > 0) {
      montoTotalUyu = ((this.toUyuAmount(montoBase, moneda, usdUyuRate) ?? 0) * porcentaje) / 100;
    } else if (porcentaje > 0) {
      // Sin monto base: porcentaje sobre el valor del viaje (ya en UYU)
      montoTotalUyu = (Number(valorViajeUyu) * porcentaje) / 100;
    }

    return {
      viajeId,
      ...comisionDTO,
      moneda,
      montoTotal: this.roundToTwo(montoTotalUyu),
      estado: comisionDTO.estado || 'pendiente',
    };
  }

  /**
   * Comisiones tipo "Operario": exige un chofer existente y usa su nombre como beneficiario.
   * Al resto de los tipos se les limpia el choferId (su beneficiario es texto libre).
   */
  private async resolverChoferesOperario<T extends { tipo?: string; choferId?: number | null; beneficiario?: string }>(
    comisiones?: T[],
  ): Promise<T[] | undefined> {
    if (!comisiones) return comisiones;

    const ids = [
      ...new Set(
        comisiones.filter((c) => esComisionOperario(c) && c.choferId).map((c) => Number(c.choferId)),
      ),
    ];
    const choferes = ids.length
      ? await this.viajRepository.manager.getRepository(Chofer).findBy({ id: In(ids) })
      : [];
    const porId = new Map(choferes.map((c) => [c.id, c]));

    return comisiones.map((c) => {
      if (!esComisionOperario(c)) return { ...c, choferId: null };
      if (!c.choferId) {
        throw new BadRequestException('Las comisiones de tipo Operario deben tener un chofer asignado');
      }
      const chofer = porId.get(Number(c.choferId));
      if (!chofer) {
        throw new BadRequestException(`Chofer ${c.choferId} no encontrado para la comisión de Operario`);
      }
      const nombre = `${chofer.nombre} ${chofer.apellido}`.replace(/\s+/g, ' ').trim();
      return { ...c, choferId: chofer.id, beneficiario: nombre };
    });
  }

  private async guardarComisiones(
    viajeId: number,
    valorViajeUyu: number,
    comisionesDTO: any[],
    usdUyuRate: number,
  ): Promise<void> {
    for (const comisionDTO of comisionesDTO) {
      const comision = this.calcularYCrearComision(viajeId, valorViajeUyu, comisionDTO, usdUyuRate);

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
            moneda,
            montoTotal,
            beneficiario,
            chofer_id,
            estado,
            notas,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          viajeId,
          viajeId,
          comision.tipo,
          comision.concepto ?? null,
          comision.montoBase ?? null,
          comision.porcentaje ?? null,
          comision.montoFijo ?? null,
          comision.moneda,
          comision.montoTotal,
          comision.beneficiario ?? null,
          comision.choferId ?? null,
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

    // Los peajes se cargan en la tabla de comisiones pero son gasto operativo
    const totalComisiones = comisiones
      .filter((com) => !esGastoOperativo(com))
      .reduce((sum, com) => sum + Number(com.montoTotal), 0);
    const totalPeajes = comisiones
      .filter((com) => esGastoOperativo(com) && com.estado !== 'cancelado')
      .reduce((sum, com) => sum + Number(com.montoTotal), 0);

    const costosOperacionales =
      Number(viaje.costoCombustible) + Number(viaje.otrosGastos) + totalPeajes;

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

  private async assertChoferExists(
    choferId: number,
    options: { requireActivo?: boolean } = {},
  ): Promise<void> {
    const chofer = await this.viajRepository.manager.getRepository(Chofer).findOne({
      where: { id: choferId },
    });

    if (!chofer) {
      throw new BadRequestException('Chofer no encontrado');
    }

    if (options.requireActivo && chofer.estado !== 'activo') {
      throw new BadRequestException(
        `El chofer ${chofer.nombre} ${chofer.apellido} no está activo (estado: ${chofer.estado})`,
      );
    }
  }

  private async assertClienteExists(clienteId: number): Promise<void> {
    const cliente = await this.viajRepository.manager.getRepository(Cliente).findOne({
      where: { id: clienteId },
    });

    if (!cliente) {
      throw new BadRequestException('Cliente no encontrado');
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
