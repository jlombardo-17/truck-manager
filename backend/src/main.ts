import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:5173',
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
