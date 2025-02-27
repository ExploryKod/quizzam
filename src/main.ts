import "reflect-metadata";
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MainModule } from './core/main.module';
import { variables } from './shared/variables.config';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);
  app.setGlobalPrefix(variables.globalPrefix);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: ['Location'],
  });

  await app.listen(variables.port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${variables.port}/${variables.globalPrefix} 💽 The chosen database is ${variables.database}`
  );
}

bootstrap();
