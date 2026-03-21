import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ChoferSalario, EstadoSalario } from './chofer-salario.entity';
import { ChoferSalarioPago, TipoPagoSalario } from './chofer-salario-pago.entity';
import { Chofer } from './chofer.entity';
import { Viaje } from '../viajes/viaje.entity';
import { ViajComision } from '../viajes/viaje-comision.entity';
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
  ) {}

  private toNumber(value: any): number {
    return parseFloat((value ?? 0).toString()) || 0;
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
   * Obtener viajes del chofer en un período con sus comisiones
   */
  async getViajesConComisionesPorPeriodo(
    choferId: number,
    mes: number,
    anio: number,
  ): Promise<{ viajes: any[]; totalComisiones: number }> {
    // Calcular rango de fechas del mes
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

    const viajes = await this.viajeRepository.find({
      where: {
        choferId,
        fechaInicio: Between(fechaInicio, fechaFin),
        estado: 'completado', // Solo viajes completados generan comisión
      },
      relations: ['comisiones'],
      order: { fechaInicio: 'ASC' },
    });

    let totalComisiones = 0;

    const viajesConTotales = viajes.map((viaje) => {
      const comisionesChofer = (viaje.comisiones || []).filter(
        (comision) => comision.beneficiario === `chofer_${choferId}` || comision.tipo === 'chofer',
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

    // Calcular comisiones si no se especifican
    let totalComisiones = dto.totalComisiones || 0;
    if (!dto.totalComisiones) {
      const resultado = await this.getViajesConComisionesPorPeriodo(dto.choferId, dto.mes, dto.anio);
      totalComisiones = resultado.totalComisiones;
    }

    const bonos = dto.bonos || 0;
    const deducciones = dto.deducciones || 0;

    // Calcular salario neto
    const salarioNeto = salarioBase + totalComisiones + bonos - deducciones;

    // Crear el registro
    const nuevoSalario = this.salarioRepository.create({
      ...dto,
      salarioBase,
      totalComisiones,
      bonos,
      deducciones,
      salarioNeto,
    });
    const saved = await this.salarioRepository.save(nuevoSalario);

    // Si se crea directamente como pagado, registrar movimiento de pago total.
    if (dto.estado === EstadoSalario.PAGADO) {
      await this.salarioPagoRepository.save(
        this.salarioPagoRepository.create({
          salarioId: saved.id,
          monto: this.toNumber(saved.salarioNeto),
          fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : new Date(),
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
    salario.salarioNeto =
      parseFloat(salario.salarioBase.toString()) +
      parseFloat(salario.totalComisiones.toString()) +
      parseFloat(salario.bonos.toString()) -
      parseFloat(salario.deducciones.toString());

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
  async marcarComoPagado(id: number, fechaPago: Date, metodoPago: string, comprobante?: string): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({ where: { id } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }

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
        fechaPago: new Date(dto.fechaPago),
        metodoPago: dto.metodoPago,
        tipo: dto.tipo || TipoPagoSalario.ADELANTO,
        comprobante: dto.comprobante,
        observaciones: dto.observaciones,
      }),
    );

    salario.fechaPago = new Date(dto.fechaPago);
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
    pago.fechaPago = new Date(dto.fechaPago);
    pago.metodoPago = dto.metodoPago;
    pago.tipo = dto.tipo || pago.tipo;
    pago.comprobante = dto.comprobante;
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

        // Calcular comisiones del período
        const { totalComisiones } = await this.getViajesConComisionesPorPeriodo(chofer.id, dto.mes, dto.anio);

        // Crear salario
        const salarioBase = parseFloat(chofer.sueldoBase?.toString() || '0');
        const salarioNeto = salarioBase + totalComisiones;

        const nuevoSalario = this.salarioRepository.create({
          choferId: chofer.id,
          mes: dto.mes,
          anio: dto.anio,
          salarioBase,
          totalComisiones,
          bonos: 0,
          deducciones: 0,
          salarioNeto,
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
