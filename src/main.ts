import "reflect-metadata";
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MainModule } from './core/main.module';
import { variables } from './shared/variables.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(MainModule);
  app.setGlobalPrefix(variables.globalPrefix);

  app.enableCors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: ['Location'],
  });

  const config = new DocumentBuilder()
    .setTitle('Quizzam API')
    .setDescription('Professeurs, Créer vos quiz et proposer-les à des étudiants via un code pour chaque quiz')
    .setVersion('1.0')
    .addTag('quiz')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);


  await app.listen(variables.port);
  Logger.log(
    `🚀 Running on: http://localhost:${variables.port}/${variables.globalPrefix} with 💽 \x1b[35m${variables.database}\x1b[32m as database`
  );
}

bootstrap();




