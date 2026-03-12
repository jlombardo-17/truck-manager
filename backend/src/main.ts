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
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost', 'http://localhost:3000', 'http://127.0.0.1'];
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.API_PORT || 3000;

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

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
