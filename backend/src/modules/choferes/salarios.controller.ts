import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalariosService } from './salarios.service';
import { CreateSalarioDto, UpdateSalarioDto, GenerarSalariosDto } from './dto/salario.dto';
import { ChoferSalario } from './chofer-salario.entity';

@Controller('api/salarios')
@UseGuards(JwtAuthGuard)
export class SalariosController {
  constructor(private readonly salariosService: SalariosService) {}

  /**
   * Obtener todos los salarios (admin)
   */
  @Get()
  async getAll(): Promise<ChoferSalario[]> {
    return await this.salariosService.getAll();
  }

  /**
   * Obtener salarios de un chofer específico
   */
  @Get('chofer/:choferId')
  async getSalariosByChofer(
    @Param('choferId', ParseIntPipe) choferId: number,
  ): Promise<ChoferSalario[]> {
    return await this.salariosService.getSalariosByChofer(choferId);
  }

  /**
   * Obtener salarios de todos los choferes por período
   */
  @Get('periodo/:anio/:mes')
  async getSalariosPorPeriodo(
    @Param('anio', ParseIntPipe) anio: number,
    @Param('mes', ParseIntPipe) mes: number,
  ): Promise<ChoferSalario[]> {
    return await this.salariosService.getSalariosPorPeriodo(mes, anio);
  }

  /**
   * Obtener salario específico de un chofer por período
   */
  @Get('chofer/:choferId/:anio/:mes')
  async getSalarioByPeriodo(
    @Param('choferId', ParseIntPipe) choferId: number,
    @Param('anio', ParseIntPipe) anio: number,
    @Param('mes', ParseIntPipe) mes: number,
  ): Promise<ChoferSalario> {
    return await this.salariosService.getSalarioByPeriodo(choferId, mes, anio);
  }

  /**
   * Obtener detalle de viajes y comisiones para un período
   */
  @Get('chofer/:choferId/:anio/:mes/detalle')
  async getViajesConComisiones(
    @Param('choferId', ParseIntPipe) choferId: number,
    @Param('anio', ParseIntPipe) anio: number,
    @Param('mes', ParseIntPipe) mes: number,
  ): Promise<{ viajes: any[]; totalComisiones: number }> {
    return await this.salariosService.getViajesConComisionesPorPeriodo(choferId, mes, anio);
  }

  /**
   * Crear un nuevo registro de salario
   */
  @Post()
  async create(@Body() dto: CreateSalarioDto): Promise<ChoferSalario> {
    return await this.salariosService.create(dto);
  }

  /**
   * Generar salarios masivamente para un período
   */
  @Post('generar')
  @HttpCode(HttpStatus.OK)
  async generarSalarios(
    @Body() dto: GenerarSalariosDto,
  ): Promise<{ creados: number; errores: string[] }> {
    return await this.salariosService.generarSalariosMasivo(dto);
  }

  /**
   * Actualizar un salario existente
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalarioDto,
  ): Promise<ChoferSalario> {
    return await this.salariosService.update(id, dto);
  }

  /**
   * Marcar salario como pagado
   */
  @Put(':id/pagar')
  async marcarComoPagado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fechaPago: Date; metodoPago: string; comprobante?: string },
  ): Promise<ChoferSalario> {
    return await this.salariosService.marcarComoPagado(
      id,
      body.fechaPago,
      body.metodoPago,
      body.comprobante,
    );
  }

  /**
   * Eliminar un salario
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.salariosService.delete(id);
  }
}
