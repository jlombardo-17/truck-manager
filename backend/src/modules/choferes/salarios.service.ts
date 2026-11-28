import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChoferSalario, EstadoSalario } from './chofer-salario.entity';
import { ChoferSalarioPago, TipoPagoSalario } from './chofer-salario-pago.entity';
import { Chofer } from './chofer.entity';
import { Viaje } from '../viajes/viaje.entity';
import { choferQueCobraComision } from '../viajes/viaje-comision.entity';
import { ChoferViatico } from '../jornadas/chofer-viatico.entity';
import { TipoViatico } from '../jornadas/tipo-viatico.enum';
import { rangoFechaViaje, toDateOnly, todayDateOnly } from '../../common/utils/date-only';
import {
  CreateSalarioDto,
  UpdateSalarioDto,
  GenerarSalariosDto,
  RegistrarPagoSalarioDto,
  UpdatePagoSalarioDto,
} from './dto/salario.dto';

@Injectable()
export class SalariosService {
  constructor(
    @InjectRepository(ChoferSalario)
    private readonly salarioRepository: Repository<ChoferSalario>,
    @InjectRepository(ChoferSalarioPago)
    private readonly salarioPagoRepository: Repository<ChoferSalarioPago>,
    @InjectRepository(Chofer)
    private readonly choferRepository: Repository<Chofer>,
    @InjectRepository(Viaje)
    private readonly viajeRepository: Repository<Viaje>,
    @InjectRepository(ChoferViatico)
    private readonly viaticoRepository: Repository<ChoferViatico>,
  ) {}

  private toNumber(value: any): number {
    return parseFloat((value ?? 0).toString()) || 0;
  }

  /** Costo empresa de referencia del chofer (cargado a mano), o null si no lo tiene. */
  private costoEmpresaDe(chofer: Chofer): number | null {
    return chofer.costoEmpresa === null || chofer.costoEmpresa === undefined ? null : this.toNumber(chofer.costoEmpresa);
  }

  private calcularNeto(salario: ChoferSalario): number {
    return (
      this.toNumber(salario.salarioBase) +
      this.toNumber(salario.totalComisiones) +
      this.toNumber(salario.totalViaticos) +
      this.toNumber(salario.bonos) -
      this.toNumber(salario.deducciones)
    );
  }

  /**
   * Suma las líneas de las jornadas del chofer para el período, separando las comisiones
   * de viaje (tipo "Viaje/comisión", incluidas las generadas desde los viajes) del resto
   * de los viáticos.
   */
  async sumarJornadas(
    choferId: number,
    mes: number,
    anio: number,
  ): Promise<{ totalComisiones: number; totalViaticos: number }> {
    const mm = String(mes).padStart(2, '0');
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const raw = await this.viaticoRepository
      .createQueryBuilder('v')
      .innerJoin('v.jornada', 'j')
      .select('COALESCE(SUM(CASE WHEN v.tipo = :tipoComision THEN v.cantidad * v.monto ELSE 0 END), 0)', 'comisiones')
      .addSelect('COALESCE(SUM(CASE WHEN v.tipo = :tipoComision THEN 0 ELSE v.cantidad * v.monto END), 0)', 'viaticos')
      .where('j.choferId = :choferId', { choferId })
      .andWhere('j.fecha BETWEEN :desde AND :hasta', {
        desde: `${anio}-${mm}-01`,
        hasta: `${anio}-${mm}-${String(ultimoDia).padStart(2, '0')}`,
      })
      .setParameter('tipoComision', TipoViatico.VIAJE_COMISION)
      .getRawOne<{ comisiones: string; viaticos: string }>();
    return {
      totalComisiones: this.toNumber(raw?.comisiones),
      totalViaticos: this.toNumber(raw?.viaticos),
    };
  }

  /**
   * Recalcula los viáticos del salario del período si está pendiente.
   * Devuelve el estado del salario tras el intento (o null si no existe).
   */
  async recalcularViaticos(
    choferId: number,
    mes: number,
    anio: number,
  ): Promise<{ salarioId: number; estado: EstadoSalario; actualizado: boolean } | null> {
    const salario = await this.salarioRepository.findOne({ where: { choferId, mes, anio } });
    if (!salario) {
      return null;
    }
    if (salario.estado !== EstadoSalario.PENDIENTE) {
      return { salarioId: salario.id, estado: salario.estado, actualizado: false };
    }

    const { totalComisiones, totalViaticos } = await this.sumarJornadas(choferId, mes, anio);
    salario.totalComisiones = totalComisiones;
    salario.totalViaticos = totalViaticos;
    salario.salarioNeto = this.calcularNeto(salario);
    const saved = await this.salarioRepository.save(salario);
    const actualizado = await this.actualizarEstadoSegunPagos(saved);
    return { salarioId: actualizado.id, estado: actualizado.estado, actualizado: true };
  }

  private async sumarPagos(salarioId: number): Promise<number> {
    const pagos = await this.salarioPagoRepository.find({ where: { salarioId } });
    return pagos.reduce((acc, pago) => acc + this.toNumber(pago.monto), 0);
  }

  private async actualizarEstadoSegunPagos(salario: ChoferSalario): Promise<ChoferSalario> {
    if (salario.estado === EstadoSalario.CANCELADO) {
      return salario;
    }

    const totalPagado = await this.sumarPagos(salario.id);
    const salarioNeto = this.toNumber(salario.salarioNeto);

    if (totalPagado >= salarioNeto && salarioNeto > 0) {
      salario.estado = EstadoSalario.PAGADO;
    } else {
      salario.estado = EstadoSalario.PENDIENTE;
    }

    return await this.salarioRepository.save(salario);
  }

  /**
   * Obtener todos los salarios de un chofer
   */
  async getSalariosByChofer(choferId: number): Promise<ChoferSalario[]> {
    const chofer = await this.choferRepository.findOne({ where: { id: choferId } });
    if (!chofer) {
      throw new NotFoundException(`Chofer con ID ${choferId} no encontrado`);
    }

    return await this.salarioRepository.find({
      where: { choferId },
      order: { anio: 'DESC', mes: 'DESC' },
      relations: ['chofer', 'pagos'],
    });
  }

  /**
   * Obtener salario de un chofer por mes y año
   */
  async getSalarioByPeriodo(choferId: number, mes: number, anio: number): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({
      where: { choferId, mes, anio },
      relations: ['chofer', 'pagos'],
    });

    if (!salario) {
      throw new NotFoundException(`Salario no encontrado para el período ${mes}/${anio}`);
    }

    return salario;
  }

  /**
   * Obtener los viajes de un período con las comisiones que cobra el chofer: tipo "Chofer" de los
   * viajes que maneja y tipo "Operario" asignadas a él (las mismas que van a sus jornadas y salario)
   */
  async getViajesConComisionesPorPeriodo(
    choferId: number,
    mes: number,
    anio: number,
  ): Promise<{ viajes: any[]; totalComisiones: number }> {
    // Calcular rango de fechas del mes
    const { desde: fechaInicio, hasta: fechaFin } = rangoFechaViaje(
      new Date(anio, mes - 1, 1),
      new Date(anio, mes, 0),
    );

    const viajes = await this.viajeRepository
      .createQueryBuilder('viaje')
      .leftJoinAndSelect('viaje.comisiones', 'comision')
      .where('viaje.fechaInicio BETWEEN :fechaInicio AND :fechaFin', { fechaInicio, fechaFin })
      .andWhere(
        `(viaje.chofer_id = :choferId OR EXISTS (
          SELECT 1 FROM viajes_comisiones op
          WHERE op.viaje_id = viaje.id AND op.chofer_id = :choferId AND LOWER(TRIM(op.tipo)) = 'operario'
        ))`,
        { choferId },
      )
      .orderBy('viaje.fechaInicio', 'ASC')
      .getMany();

    let totalComisiones = 0;

    const viajesConTotales = viajes.filter((viaje) => viaje.estado !== 'cancelado').map((viaje) => {
      const comisionesChofer = (viaje.comisiones || []).filter(
        (comision) =>
          choferQueCobraComision(comision, viaje.choferId) === Number(choferId) && comision.estado !== 'cancelado',
      );

      const totalComisionViaje = comisionesChofer.reduce(
        (acc, comision) => acc + this.toNumber(comision.montoTotal),
        0,
      );

      totalComisiones += totalComisionViaje;

      return {
        id: viaje.id,
        numeroViaje: viaje.numeroViaje,
        fechaInicio: viaje.fechaInicio,
        fechaFin: viaje.fechaFin,
        origen: viaje.origen,
        destino: viaje.destino,
        valorViaje: this.toNumber(viaje.valorViaje),
        totalComision: totalComisionViaje,
        comisiones: comisionesChofer.map((comision) => ({
          id: comision.id,
          tipo: comision.tipo,
          concepto: comision.concepto,
          montoBase: this.toNumber(comision.montoBase),
          porcentaje: this.toNumber(comision.porcentaje),
          montoFijo: this.toNumber(comision.montoFijo),
          montoTotal: this.toNumber(comision.montoTotal),
          beneficiario: comision.beneficiario,
          estado: comision.estado,
        })),
      };
    });

    return { viajes: viajesConTotales, totalComisiones };
  }

  /**
   * Calcular comisión de un viaje para el chofer
   */
  private async calcularComisionViaje(viaje: Viaje, chofer: Chofer): Promise<number> {
    if (!chofer.porcentajeComision || chofer.porcentajeComision === 0) {
      return 0;
    }

    const valorViaje = parseFloat(viaje.valorViaje.toString());
    const comision = (valorViaje * chofer.porcentajeComision) / 100;

    return comision;
  }

  /**
   * Crear un nuevo registro de salario
   */
  async create(dto: CreateSalarioDto): Promise<ChoferSalario> {
    // Verificar que el chofer existe
    const chofer = await this.choferRepository.findOne({ where: { id: dto.choferId } });
    if (!chofer) {
      throw new NotFoundException(`Chofer con ID ${dto.choferId} no encontrado`);
    }

    // Verificar que no exista ya un salario para ese período
    const existente = await this.salarioRepository.findOne({
      where: { choferId: dto.choferId, mes: dto.mes, anio: dto.anio },
    });

    if (existente) {
      throw new BadRequestException(
        `Ya existe un registro de salario para el período ${dto.mes}/${dto.anio}`,
      );
    }

    // Obtener salario base del chofer si no se especifica
    const salarioBase =
      dto.salarioBase !== undefined ? dto.salarioBase : parseFloat(chofer.sueldoBase?.toString() || '0');

    // Comisiones de viaje y viáticos salen de las jornadas del período (salvo que se indiquen)
    const jornadas = await this.sumarJornadas(dto.choferId, dto.mes, dto.anio);
    const totalComisiones = dto.totalComisiones ? dto.totalComisiones : jornadas.totalComisiones;
    const totalViaticos = jornadas.totalViaticos;
    const costoEmpresa = dto.costoEmpresa ?? this.costoEmpresaDe(chofer);
    const bonos = dto.bonos || 0;
    const deducciones = dto.deducciones || 0;

    // Calcular salario neto
    const salarioNeto = salarioBase + totalComisiones + totalViaticos + bonos - deducciones;

    // Crear el registro
    const nuevoSalario = this.salarioRepository.create({
      ...dto,
      salarioBase,
      totalComisiones,
      totalViaticos,
      bonos,
      deducciones,
      salarioNeto,
      costoEmpresa,
    });
    const saved = await this.salarioRepository.save(nuevoSalario);

    // Si se crea directamente como pagado, registrar movimiento de pago total.
    if (dto.estado === EstadoSalario.PAGADO) {
      await this.salarioPagoRepository.save(
        this.salarioPagoRepository.create({
          salarioId: saved.id,
          monto: this.toNumber(saved.salarioNeto),
          fechaPago: dto.fechaPago || todayDateOnly(),
          metodoPago: dto.metodoPago || 'manual',
          tipo: TipoPagoSalario.LIQUIDACION,
          comprobante: dto.comprobante,
          observaciones: dto.observaciones,
        }),
      );
    }

    const actualizado = await this.actualizarEstadoSegunPagos(saved);
    return await this.salarioRepository.findOne({
      where: { id: actualizado.id },
      relations: ['chofer', 'pagos'],
    });
  }

  /**
   * Actualizar un salario existente
   */
  async update(id: number, dto: UpdateSalarioDto): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({ where: { id } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }

    // Actualizar campos
    Object.assign(salario, dto);

    // Recalcular salario neto
    salario.salarioNeto = this.calcularNeto(salario);

    const saved = await this.salarioRepository.save(salario);
    await this.actualizarEstadoSegunPagos(saved);
    return await this.salarioRepository.findOne({
      where: { id: saved.id },
      relations: ['chofer', 'pagos'],
    });
  }

  /**
   * Recalcula comisiones de viaje y viáticos desde las jornadas del período, aunque el
   * salario ya esté pagado (los salarios pagados no se recalculan solos). Opcionalmente
   * toma el sueldo base actual del chofer. Bonos, deducciones y pagos no se tocan; el
   * estado se reajusta según lo pagado.
   */
  async recalcularDesdeJornadas(
    id: number,
    opciones: { actualizarSueldoBase?: boolean } = {},
  ): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({ where: { id }, relations: ['chofer'] });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }
    if (salario.estado === EstadoSalario.CANCELADO) {
      throw new BadRequestException('No se puede recalcular un salario cancelado');
    }

    const { totalComisiones, totalViaticos } = await this.sumarJornadas(
      salario.choferId,
      salario.mes,
      salario.anio,
    );
    salario.totalComisiones = totalComisiones;
    salario.totalViaticos = totalViaticos;
    if (opciones.actualizarSueldoBase && salario.chofer) {
      salario.salarioBase = this.toNumber(salario.chofer.sueldoBase);
    }
    salario.salarioNeto = this.calcularNeto(salario);
    delete (salario as Partial<ChoferSalario>).chofer;

    const saved = await this.salarioRepository.save(salario);
    await this.actualizarEstadoSegunPagos(saved);
    return await this.salarioRepository.findOne({
      where: { id: saved.id },
      relations: ['chofer', 'pagos'],
    });
  }

  /**
   * Marcar salario como pagado
   */
  async marcarComoPagado(
    id: number,
    fechaPagoInput: string | undefined,
    metodoPago: string,
    comprobante?: string,
  ): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({ where: { id } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }

    // El body de este endpoint no pasa por un DTO, así que se normaliza acá
    const fechaPago = toDateOnly(fechaPagoInput) ?? todayDateOnly();

    const totalPagado = await this.sumarPagos(id);
    const faltante = this.toNumber(salario.salarioNeto) - totalPagado;

    if (faltante <= 0) {
      salario.estado = EstadoSalario.PAGADO;
      return await this.salarioRepository.save(salario);
    }

    await this.salarioPagoRepository.save(
      this.salarioPagoRepository.create({
        salarioId: id,
        monto: faltante,
        fechaPago,
        metodoPago,
        tipo: TipoPagoSalario.LIQUIDACION,
        comprobante,
      }),
    );

    salario.fechaPago = fechaPago;
    salario.metodoPago = metodoPago;
    if (comprobante) {
      salario.comprobante = comprobante;
    }

    const saved = await this.salarioRepository.save(salario);
    const actualizado = await this.actualizarEstadoSegunPagos(saved);
    return await this.salarioRepository.findOne({
      where: { id: actualizado.id },
      relations: ['chofer', 'pagos'],
    });
  }

  async getPagosBySalario(salarioId: number): Promise<ChoferSalarioPago[]> {
    const salario = await this.salarioRepository.findOne({ where: { id: salarioId } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${salarioId} no encontrado`);
    }

    return await this.salarioPagoRepository.find({
      where: { salarioId },
      order: { fechaPago: 'DESC', id: 'DESC' },
    });
  }

  async registrarPago(id: number, dto: RegistrarPagoSalarioDto): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({ where: { id } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }

    const monto = this.toNumber(dto.monto);
    if (monto <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0');
    }

    await this.salarioPagoRepository.save(
      this.salarioPagoRepository.create({
        salarioId: id,
        monto,
        fechaPago: dto.fechaPago,
        metodoPago: dto.metodoPago,
        tipo: dto.tipo || TipoPagoSalario.ADELANTO,
        comprobante: dto.comprobante,
        comprobanteAdjunto: dto.comprobanteAdjunto,
        observaciones: dto.observaciones,
      }),
    );

    salario.fechaPago = dto.fechaPago;
    salario.metodoPago = dto.metodoPago;
    if (dto.comprobante) {
      salario.comprobante = dto.comprobante;
    }

    const saved = await this.salarioRepository.save(salario);
    const actualizado = await this.actualizarEstadoSegunPagos(saved);
    return await this.salarioRepository.findOne({
      where: { id: actualizado.id },
      relations: ['chofer', 'pagos'],
    });
  }

  async updatePago(salarioId: number, pagoId: number, dto: UpdatePagoSalarioDto): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({ where: { id: salarioId } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${salarioId} no encontrado`);
    }

    const pago = await this.salarioPagoRepository.findOne({ where: { id: pagoId, salarioId } });
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${pagoId} no encontrado para el salario ${salarioId}`);
    }

    pago.monto = this.toNumber(dto.monto);
    pago.fechaPago = dto.fechaPago;
    pago.metodoPago = dto.metodoPago;
    pago.tipo = dto.tipo || pago.tipo;
    pago.comprobante = dto.comprobante;
    pago.comprobanteAdjunto = dto.comprobanteAdjunto;
    pago.observaciones = dto.observaciones;

    await this.salarioPagoRepository.save(pago);

    salario.fechaPago = pago.fechaPago;
    salario.metodoPago = pago.metodoPago;
    if (pago.comprobante) {
      salario.comprobante = pago.comprobante;
    }

    const saved = await this.salarioRepository.save(salario);
    const actualizado = await this.actualizarEstadoSegunPagos(saved);
    return await this.salarioRepository.findOne({
      where: { id: actualizado.id },
      relations: ['chofer', 'pagos'],
    });
  }

  async deletePago(salarioId: number, pagoId: number): Promise<void> {
    const salario = await this.salarioRepository.findOne({ where: { id: salarioId } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${salarioId} no encontrado`);
    }

    const pago = await this.salarioPagoRepository.findOne({ where: { id: pagoId, salarioId } });
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${pagoId} no encontrado para el salario ${salarioId}`);
    }

    await this.salarioPagoRepository.remove(pago);
    await this.actualizarEstadoSegunPagos(salario);
  }

  /**
   * Eliminar un salario
   */
  async delete(id: number): Promise<void> {
    const salario = await this.salarioRepository.findOne({ where: { id } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }

    await this.salarioRepository.remove(salario);
  }

  /**
   * Generar salarios automáticamente para todos los choferes activos de un mes/año
   */
  async generarSalariosMasivo(dto: GenerarSalariosDto): Promise<{ creados: number; errores: string[] }> {
    // Obtener todos los choferes activos
    const choferes = await this.choferRepository.find({ where: { estado: 'activo' } });

    let creados = 0;
    const errores: string[] = [];

    for (const chofer of choferes) {
      try {
        // Verificar si ya existe salario para este período
        const existente = await this.salarioRepository.findOne({
          where: { choferId: chofer.id, mes: dto.mes, anio: dto.anio },
        });

        if (existente) {
          errores.push(`Chofer ${chofer.nombre} ${chofer.apellido} ya tiene salario para ${dto.mes}/${dto.anio}`);
          continue;
        }

        // Comisiones de viaje y viáticos del período (desde las jornadas)
        const { totalComisiones, totalViaticos } = await this.sumarJornadas(chofer.id, dto.mes, dto.anio);

        // Crear salario
        const salarioBase = parseFloat(chofer.sueldoBase?.toString() || '0');
        const salarioNeto = salarioBase + totalComisiones + totalViaticos;

        const nuevoSalario = this.salarioRepository.create({
          choferId: chofer.id,
          mes: dto.mes,
          anio: dto.anio,
          salarioBase,
          totalComisiones,
          totalViaticos,
          bonos: 0,
          deducciones: 0,
          salarioNeto,
          costoEmpresa: this.costoEmpresaDe(chofer),
          estado: EstadoSalario.PENDIENTE,
        });

        await this.salarioRepository.save(nuevoSalario);
        creados++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        errores.push(`Error generando salario para ${chofer.nombre} ${chofer.apellido}: ${errorMessage}`);
      }
    }

    return { creados, errores };
  }

  /**
   * Obtener todos los salarios (para admin)
   */
  async getAll(): Promise<ChoferSalario[]> {
    return await this.salarioRepository.find({
      relations: ['chofer', 'pagos'],
      order: { anio: 'DESC', mes: 'DESC' },
    });
  }

  /**
   * Obtener salarios por período (todos los choferes)
   */
  async getSalariosPorPeriodo(mes: number, anio: number): Promise<ChoferSalario[]> {
    return await this.salarioRepository.find({
      where: { mes, anio },
      relations: ['chofer', 'pagos'],
      order: { salarioNeto: 'DESC' },
    });
  }
}
