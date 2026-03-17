import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Camion } from './camion.entity';
import { Servicio } from './servicio.entity';
import { Documento } from './documento.entity';
import { Repostada } from './repostada.entity';
import { MantenimientoTipo } from './mantenimiento-tipo.entity';
import { MantenimientoRegistro } from './mantenimiento-registro.entity';
import { ConfiguracionVehicular } from './configuracion-vehicular.entity';
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
import { ConfiguracionVehicularController } from './configuracion-vehicular.controller';
import { ConfiguracionVehicularService } from './configuracion-vehicular.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Camion,
      Servicio,
      Documento,
      Repostada,
      MantenimientoTipo,
      MantenimientoRegistro,
      ConfiguracionVehicular,
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
    ConfiguracionVehicularController,
  ],
  providers: [
    CamionesService,
    ServiciosService,
    DocumentosService,
    RepostadasService,
    MantenimientoService,
    ConfiguracionVehicularService,
  ],
  exports: [CamionesService, ServiciosService, DocumentosService, RepostadasService, MantenimientoService],
})
export class CamionesModule {}
