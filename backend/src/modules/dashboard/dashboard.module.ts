import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Viaje } from '../viajes/viaje.entity';
import { Repostada } from '../camiones/repostada.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { Documento } from '../camiones/documento.entity';
import { ChoferDocumento } from '../choferes/chofer-documento.entity';
import { ChoferSalarioPago } from '../choferes/chofer-salario-pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Viaje,
      Repostada,
      MantenimientoRegistro,
      Documento,
      ChoferDocumento,
      ChoferSalarioPago,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
