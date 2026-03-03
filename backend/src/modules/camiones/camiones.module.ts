import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camion } from './camion.entity';
import { Servicio } from './servicio.entity';
import { Documento } from './documento.entity';
import { CamionesController } from './camiones.controller';
import { CamionesService } from './camiones.service';
import { ServiciosController } from './servicios.controller';
import { ServiciosService } from './servicios.service';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Camion, Servicio, Documento])],
  controllers: [CamionesController, ServiciosController, DocumentosController],
  providers: [CamionesService, ServiciosService, DocumentosService],
  exports: [CamionesService, ServiciosService, DocumentosService],
})
export class CamionesModule {}
