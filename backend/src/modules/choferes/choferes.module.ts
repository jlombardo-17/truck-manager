import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Chofer } from './chofer.entity';
import { ChoferDocumento } from './chofer-documento.entity';
import { ChoferesService } from './choferes.service';
import { ChoferesController } from './choferes.controller';
import { ChoferDocumentosService } from './chofer-documentos.service';
import { ChoferDocumentosController } from './chofer-documentos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Chofer, ChoferDocumento]), AuthModule],
  controllers: [ChoferesController, ChoferDocumentosController],
  providers: [ChoferesService, ChoferDocumentosService],
  exports: [ChoferesService, ChoferDocumentosService],
})
export class ChoferesModule {}
