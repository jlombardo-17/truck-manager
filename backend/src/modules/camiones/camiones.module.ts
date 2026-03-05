import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Camion } from './camion.entity';
import { Servicio } from './servicio.entity';
import { Documento } from './documento.entity';
import { Repostada } from './repostada.entity';
import { MantenimientoTipo } from './mantenimiento-tipo.entity';
import { MantenimientoRegistro } from './mantenimiento-registro.entity';
import { CamionesController } from './camiones.controller';
import { CamionesService } from './camiones.service';
import { ServiciosController } from './servicios.controller';
import { ServiciosService } from './servicios.service';
import { DocumentosController, DocumentosCamionesAlertasController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { RepostadasController } from './repostadas.controller';
import { RepostadasService } from './repostadas.service';
import { MantenimientoController } from './mantenimiento.controller';
import { MantenimientoService } from './mantenimiento.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Camion,
      Servicio,
      Documento,
      Repostada,
      MantenimientoTipo,
      MantenimientoRegistro,
    ]),
    AuthModule,
  ],
  controllers: [
    CamionesController,
    ServiciosController,
    DocumentosController,
    DocumentosCamionesAlertasController,
    RepostadasController,
    MantenimientoController,
  ],
  providers: [
    CamionesService,
    ServiciosService,
    DocumentosService,
    RepostadasService,
    MantenimientoService,
  ],
  exports: [CamionesService, ServiciosService, DocumentosService, RepostadasService, MantenimientoService],
})
export class CamionesModule {}
