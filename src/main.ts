import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  const configService: ConfigService = app.get(ConfigService);
  const APP_PORT: number = Number(configService.get('APP_PORT')) || 3003;

  await app.listen(APP_PORT);
}

bootstrap().then().catch(console.error);
