import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ViajsService } from './viajes.service';
import { CreateViajDTO } from './dto/create-viaje.dto';
import { UpdateViajDTO } from './dto/update-viaje.dto';
import { SaveViajRutasDTO } from './dto/create-viaje-ruta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { toDateOnly } from '../../common/utils/date-only';

@UseGuards(JwtAuthGuard)
@Controller('viajes')
export class ViajsController {
  constructor(private readonly viajsService: ViajsService) {}

  /**
   * POST /api/viajes - Crear un nuevo viaje
   */
  @Post()
  async create(@Body() createViajDTO: CreateViajDTO) {
    return this.viajsService.create(createViajDTO);
  }

  /**
   * GET /api/viajes - Obtener todos los viajes con filtros opcionales
   * Query params: ?estado=completado&camionId=1&choferId=2&clienteId=3
   */
  @Get()
  async findAll(
    @Query('estado') estado?: string,
    @Query('camionId') camionId?: string,
    @Query('choferId') choferId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('fechaPagoDesde') fechaPagoDesde?: string,
    @Query('fechaPagoHasta') fechaPagoHasta?: string,
  ) {
    const filters = {
      ...(estado && { estado }),
      ...(camionId && { camionId: parseInt(camionId) }),
      ...(choferId && { choferId: parseInt(choferId) }),
      ...(clienteId && { clienteId: parseInt(clienteId) }),
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      // fechaPago es DATE: se filtra con 'YYYY-MM-DD' para no correr el día por zona horaria
      ...(toDateOnly(fechaPagoDesde) && { fechaPagoDesde: toDateOnly(fechaPagoDesde)! }),
      ...(toDateOnly(fechaPagoHasta) && { fechaPagoHasta: toDateOnly(fechaPagoHasta)! }),
    };

    return this.viajsService.findAll(filters);
  }

  /**
   * GET /api/viajes/tipo-cambio/usd-uyu - Obtener cotización actual USD a UYU
   */
  @Get('tipo-cambio/usd-uyu')
  async getUsdUyuRate() {
    return this.viajsService.getUsdUyuRate();
  }

  /**
   * POST /api/viajes/comisiones-chofer/sincronizar - Vuelve a generar en las jornadas las
   * comisiones tipo "Chofer" de todos los viajes y recalcula los salarios pendientes.
   * Idempotente; se usa una vez tras migrar datos viejos.
   */
  @Post('comisiones-chofer/sincronizar')
  async sincronizarComisionesChofer() {
    return this.viajsService.sincronizarComisionesChofer();
  }

  /**
   * GET /api/viajes/combustible/precio-gasoil?fecha=YYYY-MM-DD - Precio del litro de gasoil
   * 50-S (ANCAP) vigente en la fecha indicada (default: hoy)
   */
  @Get('combustible/precio-gasoil')
  async getPrecioGasoil(@Query('fecha') fecha?: string) {
    return this.viajsService.getPrecioGasoil(fecha);
  }

  /**
   * GET /api/viajes/:id - Obtener un viaje por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.viajsService.findOneWithRelations(id);
  }

  /**
   * GET /api/viajes/:id/comisiones - Obtener las comisiones de un viaje
   */
  @Get(':id/comisiones')
  async getComisiones(@Param('id', ParseIntPipe) id: number) {
    return this.viajsService.getComisiones(id);
  }

  /**
   * GET /api/viajes/:id/desglose - Obtener el desglose económico de un viaje
   */
  @Get(':id/desglose')
  async getDesglose(@Param('id', ParseIntPipe) id: number) {
    return this.viajsService.getDesglose(id);
  }

  /**
   * GET /api/viajes/:id/rutas - Obtener las rutas de un viaje
   */
  @Get(':id/rutas')
  async getRoutes(@Param('id', ParseIntPipe) id: number) {
    return this.viajsService.getRoutes(id);
  }

  /**
   * POST /api/viajes/:id/rutas - Guardar/actualizar rutas de un viaje
   */
  @Post(':id/rutas')
  async saveRoutes(
    @Param('id', ParseIntPipe) id: number,
    @Body() saveViajRutasDTO: SaveViajRutasDTO,
  ) {
    return this.viajsService.saveRoutes(
      id,
      saveViajRutasDTO.rutas,
      saveViajRutasDTO.kmRecorridos,
    );
  }

  /**
   * PATCH /api/viajes/:id - Actualizar un viaje
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateViajDTO: UpdateViajDTO,
  ) {
    return this.viajsService.update(id, updateViajDTO);
  }

  /**
   * PATCH /api/viajes/:id/estado - Cambiar el estado de un viaje
   */
  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ) {
    return this.viajsService.cambiarEstado(id, estado);
  }

  /**
   * DELETE /api/viajes/:id - Eliminar un viaje
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.viajsService.remove(id);
    return { message: 'Viaje eliminado exitosamente' };
  }
}
