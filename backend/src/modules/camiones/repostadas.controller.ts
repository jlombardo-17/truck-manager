import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RepostadasService } from './repostadas.service';
import { CreateRepostadaDto, UpdateRepostadaDto } from './dto/repostada.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('camiones/:camionId/repostadas')
export class RepostadasController {
  constructor(private readonly repostadasService: RepostadasService) {}

  @Get()
  async findByCamion(@Param('camionId') camionId: number) {
    return this.repostadasService.findByCamion(camionId);
  }

  @Get('estadisticas')
  async getEstadisticas(@Param('camionId') camionId: number) {
    return this.repostadasService.getEstadisticas(camionId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.repostadasService.findOne(id);
  }

  @Post()
  async create(
    @Param('camionId') camionId: number,
    @Body() createRepostadaDto: CreateRepostadaDto,
  ) {
    return this.repostadasService.create(camionId, createRepostadaDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateRepostadaDto: UpdateRepostadaDto,
  ) {
    return this.repostadasService.update(id, updateRepostadaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.repostadasService.remove(id);
  }
}
