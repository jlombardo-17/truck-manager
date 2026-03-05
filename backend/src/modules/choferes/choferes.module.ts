import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chofer } from './chofer.entity';
import { ChoferDocumento } from './chofer-documento.entity';
import { ChoferesService } from './choferes.service';
import { ChoferesController } from './choferes.controller';
import { ChoferDocumentosService } from './chofer-documentos.service';
import { ChoferDocumentosController, DocumentosAlertasController } from './chofer-documentos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Chofer, ChoferDocumento])],
  controllers: [ChoferesController, ChoferDocumentosController, DocumentosAlertasController],
  providers: [ChoferesService, ChoferDocumentosService],
  exports: [ChoferesService, ChoferDocumentosService],
})
export class ChoferesModule {}
