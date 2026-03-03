import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChoferesService } from './choferes.service';
import { CreateChoferDto, UpdateChoferDto } from './dto/chofer.dto';

@Controller('choferes')
@UseGuards(JwtAuthGuard)
export class ChoferesController {
  constructor(private readonly choferesService: ChoferesService) {}

  @Get()
  findAll() {
    return this.choferesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.choferesService.findOne(+id);
  }

  @Post()
  create(@Body() createChoferDto: CreateChoferDto) {
    return this.choferesService.create(createChoferDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateChoferDto: UpdateChoferDto) {
    return this.choferesService.update(+id, updateChoferDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.choferesService.remove(+id);
  }
}
