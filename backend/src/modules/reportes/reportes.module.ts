import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Viaje } from '../viajes/viaje.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Camion } from '../camiones/camion.entity';
import { Documento } from '../camiones/documento.entity';
import { Repostada } from '../camiones/repostada.entity';
import { ChoferSalarioPago } from '../choferes/chofer-salario-pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Viaje,
      MantenimientoRegistro,
      Chofer,
      Camion,
      Documento,
      Repostada,
      ChoferSalarioPago,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
