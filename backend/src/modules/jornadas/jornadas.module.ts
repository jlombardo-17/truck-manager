import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChoferesModule } from '../choferes/choferes.module';
import { Chofer } from '../choferes/chofer.entity';
import { Viaje } from '../viajes/viaje.entity';
import { ChoferJornada } from './chofer-jornada.entity';
import { ChoferViatico } from './chofer-viatico.entity';
import { ViaticoTipo } from './viatico-tipo.entity';
import { JornadasService } from './jornadas.service';
import { JornadasController } from './jornadas.controller';
import { ViaticoTiposService } from './viatico-tipos.service';
import { ViaticoTiposController } from './viatico-tipos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChoferJornada, ChoferViatico, ViaticoTipo, Chofer, Viaje]),
    AuthModule,
    ChoferesModule,
  ],
  controllers: [JornadasController, ViaticoTiposController],
  providers: [JornadasService, ViaticoTiposService],
  exports: [JornadasService],
})
export class JornadasModule {}
