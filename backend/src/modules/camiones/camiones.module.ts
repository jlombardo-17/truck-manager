import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camion } from './camion.entity';
import { Servicio } from './servicio.entity';
import { Documento } from './documento.entity';
import { Repostada } from './repostada.entity';
import { CamionesController } from './camiones.controller';
import { CamionesService } from './camiones.service';
import { ServiciosController } from './servicios.controller';
import { ServiciosService } from './servicios.service';
import { DocumentosController, DocumentosCamionesAlertasController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { RepostadasController } from './repostadas.controller';
import { RepostadasService } from './repostadas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Camion, Servicio, Documento, Repostada])],
  controllers: [
    CamionesController, 
    ServiciosController, 
    DocumentosController, 
    DocumentosCamionesAlertasController,
    RepostadasController
  ],
  providers: [CamionesService, ServiciosService, DocumentosService, RepostadasService],
  exports: [CamionesService, ServiciosService, DocumentosService, RepostadasService],
})
export class CamionesModule {}
