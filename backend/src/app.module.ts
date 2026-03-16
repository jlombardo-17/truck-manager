import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CamionesModule } from './modules/camiones/camiones.module';
import { ChoferesModule } from './modules/choferes/choferes.module';
import { ViajsModule } from './modules/viajes/viajes.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'truck_manager',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // synchronize: true crea las tablas automáticamente.
      // En producción: falso por defecto, pero se puede activar con DB_SYNC=true
      // SÓLO para el primer deploy (crear tablas). Luego volver a false.
      synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    CamionesModule,
    ChoferesModule,
    ViajsModule,
    ReportesModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
