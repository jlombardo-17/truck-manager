import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Chofer } from './chofer.entity';
import { ChoferDocumento } from './chofer-documento.entity';
import { ChoferSalario } from './chofer-salario.entity';
import { ChoferesService } from './choferes.service';
import { ChoferesController } from './choferes.controller';
import { ChoferDocumentosService } from './chofer-documentos.service';
import { ChoferDocumentosController } from './chofer-documentos.controller';
import { SalariosService } from './salarios.service';
import { SalariosController } from './salarios.controller';
import { Viaje } from '../viajes/viaje.entity';
import { ViajComision } from '../viajes/viaje-comision.entity';
import { ChoferSalarioPago } from './chofer-salario-pago.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Chofer,
      ChoferDocumento,
      ChoferSalario,
      ChoferSalarioPago,
      Viaje,
      ViajComision,
    ]),
    AuthModule,
  ],
  controllers: [
    ChoferesController,
    ChoferDocumentosController,
    SalariosController,
  ],
  providers: [
    ChoferesService,
    ChoferDocumentosService,
    SalariosService,
  ],
  exports: [
    ChoferesService,
    ChoferDocumentosService,
    SalariosService,
  ],
})
export class ChoferesModule {}
