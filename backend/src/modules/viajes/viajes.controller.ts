import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ViajsService } from './viajes.service';
import { CreateViajDTO } from './dto/create-viaje.dto';
import { UpdateViajDTO } from './dto/update-viaje.dto';
import { SaveViajRutasDTO } from './dto/create-viaje-ruta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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
   * Query params: ?estado=completado&camionId=1&choferId=2
   */
  @Get()
  async findAll(
    @Query('estado') estado?: string,
    @Query('camionId') camionId?: string,
    @Query('choferId') choferId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('fechaPagoDesde') fechaPagoDesde?: string,
    @Query('fechaPagoHasta') fechaPagoHasta?: string,
  ) {
    const filters = {
      ...(estado && { estado }),
      ...(camionId && { camionId: parseInt(camionId) }),
      ...(choferId && { choferId: parseInt(choferId) }),
      ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
      ...(fechaFin && { fechaFin: new Date(fechaFin) }),
      ...(fechaPagoDesde && { fechaPagoDesde: new Date(fechaPagoDesde) }),
      ...(fechaPagoHasta && { fechaPagoHasta: new Date(fechaPagoHasta) }),
    };

    return this.viajsService.findAll(filters);
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
