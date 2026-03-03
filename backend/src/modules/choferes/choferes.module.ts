import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chofer } from './chofer.entity';
import { ChoferesService } from './choferes.service';
import { ChoferesController } from './choferes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Chofer])],
  controllers: [ChoferesController],
  providers: [ChoferesService],
  exports: [ChoferesService],
})
export class ChoferesModule {}
