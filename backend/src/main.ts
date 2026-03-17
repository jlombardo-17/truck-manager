import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aumentar límite de payload para soportar archivos grandes (hasta 50MB)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  
  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL]
      : (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
          // En desarrollo, permitir cualquier origen localhost o sin origen (same-origin / curl)
          if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            cb(null, true);
          } else {
            cb(new Error(`CORS: origen no permitido: ${origin}`));
          }
        };

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = process.env.API_PORT || 3000;

  // Seed user en desarrollo (siempre)
  if (process.env.NODE_ENV !== 'production') {
    const usersService = app.get(UsersService);
    const seededUser = await usersService.ensureDevUser({
      email: process.env.DEV_SEED_EMAIL || 'admin@truckmanager.local',
      password: process.env.DEV_SEED_PASSWORD || 'admin123',
      firstName: process.env.DEV_SEED_FIRST_NAME || 'Admin',
      lastName: process.env.DEV_SEED_LAST_NAME || 'Demo',
      role: process.env.DEV_SEED_ROLE || 'admin',
    });

    console.log(`[seed] Development user ready: ${seededUser.email}`);
  }

  // Seed usuario admin en producción si se proveen las variables ADMIN_EMAIL y ADMIN_PASSWORD
  // Útil para el primer deploy: luego de crear el usuario se pueden quitar las variables.
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const usersService = app.get(UsersService);
    const seededAdmin = await usersService.ensureDevUser({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'TruckManager',
      role: 'admin',
    });
    console.log(`[seed] Admin user ready: ${seededAdmin.email}`);
  }

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
