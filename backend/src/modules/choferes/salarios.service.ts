import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ChoferSalario, EstadoSalario } from './chofer-salario.entity';
import { Chofer } from './chofer.entity';
import { Viaje } from '../viajes/viaje.entity';
import { ViajComision } from '../viajes/viaje-comision.entity';
import { CreateSalarioDto, UpdateSalarioDto, GenerarSalariosDto } from './dto/salario.dto';

@Injectable()
export class SalariosService {
  constructor(
    @InjectRepository(ChoferSalario)
    private readonly salarioRepository: Repository<ChoferSalario>,
    @InjectRepository(Chofer)
    private readonly choferRepository: Repository<Chofer>,
    @InjectRepository(Viaje)
    private readonly viajeRepository: Repository<Viaje>,
  ) {}

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
      relations: ['chofer'],
    });
  }

  /**
   * Obtener salario de un chofer por mes y año
   */
  async getSalarioByPeriodo(choferId: number, mes: number, anio: number): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({
      where: { choferId, mes, anio },
      relations: ['chofer'],
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
  ): Promise<{ viajes: Viaje[]; totalComisiones: number }> {
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

    // Calcular total de comisiones del chofer
    viajes.forEach((viaje) => {
      if (viaje.comisiones && viaje.comisiones.length > 0) {
        viaje.comisiones.forEach((comision) => {
          // Solo contar comisiones del chofer (por ejemplo, tipo 'contratista' o beneficiario)
          if (comision.beneficiario === `chofer_${choferId}` || comision.tipo === 'chofer') {
            totalComisiones += parseFloat(comision.montoTotal.toString());
          }
        });
      }
    });

    return { viajes, totalComisiones };
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

    return await this.salarioRepository.save(nuevoSalario);
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

    return await this.salarioRepository.save(salario);
  }

  /**
   * Marcar salario como pagado
   */
  async marcarComoPagado(id: number, fechaPago: Date, metodoPago: string, comprobante?: string): Promise<ChoferSalario> {
    const salario = await this.salarioRepository.findOne({ where: { id } });
    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }

    salario.estado = EstadoSalario.PAGADO;
    salario.fechaPago = fechaPago;
    salario.metodoPago = metodoPago;
    if (comprobante) {
      salario.comprobante = comprobante;
    }

    return await this.salarioRepository.save(salario);
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
      relations: ['chofer'],
      order: { anio: 'DESC', mes: 'DESC' },
    });
  }

  /**
   * Obtener salarios por período (todos los choferes)
   */
  async getSalariosPorPeriodo(mes: number, anio: number): Promise<ChoferSalario[]> {
    return await this.salarioRepository.find({
      where: { mes, anio },
      relations: ['chofer'],
      order: { salarioNeto: 'DESC' },
    });
  }
}
