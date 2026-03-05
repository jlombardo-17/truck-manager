import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Viaje } from './viaje.entity';
import { ViajRuta } from './viaje-ruta.entity';
import { ViajComision } from './viaje-comision.entity';
import { ViajsService } from './viajes.service';
import { ViajsController } from './viajes.controller';
import { CamionesModule } from '../camiones/camiones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Viaje, ViajRuta, ViajComision]),
    AuthModule,
    CamionesModule,
  ],
  controllers: [ViajsController],
  providers: [ViajsService],
  exports: [ViajsService],
})
export class ViajsModule {}
