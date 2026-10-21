import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Viaje } from '../viajes/viaje.entity';
import { MantenimientoRegistro } from '../camiones/mantenimiento-registro.entity';
import { Chofer } from '../choferes/chofer.entity';
import { Camion } from '../camiones/camion.entity';
import { Documento } from '../camiones/documento.entity';
import { Servicio } from '../camiones/servicio.entity';
import { GastoFijo } from '../camiones/gasto-fijo.entity';
import { ChoferSalarioPago } from '../choferes/chofer-salario-pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Viaje,
      MantenimientoRegistro,
      Chofer,
      Camion,
      Documento,
      Servicio,
      GastoFijo,
      ChoferSalarioPago,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
