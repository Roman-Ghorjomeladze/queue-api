import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Queue API')
    .setDescription(
      'An API to publish messages and subscribe them into the queues provided by different providers.',
    )
    .setVersion('1.0')
    .addTag('Queue NestJS NodeJS TypeScript')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const configService: ConfigService = app.get(ConfigService);
  const APP_PORT: number = Number(configService.get('APP_PORT')) || 3003;

  await app.listen(APP_PORT);
}

bootstrap().then().catch(console.error);
