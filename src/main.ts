import "reflect-metadata";
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MainModule } from './core/main.module';
import { variables } from './shared/variables.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';


async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(MainModule);

  // Set up EJS as the templating engine
  app.useStaticAssets(join(__dirname, '..', 'static'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');
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
  console.log("\x1b[36m *************************************** \n 🌞 Hello in Quizzam API - Version 1.0.0 \n 🏡 Architecture : hexagonale \n *************************************** ");
  Logger.log(
    `🚀 Running on: http://localhost:${variables.port}/${variables.globalPrefix} with 💽 \x1b[35m${variables.database}\x1b[32m as database (alternative : \x1b[36mMONGODB)`,
  );
  Logger.log(
    `🔧 e2e tests are in \x1b[38;5;226m${join(__dirname, '..', 'e2e/src/server')}\x1b[0m`,
  );
  Logger.log(
    `🔧 Only use 💽 \x1b[35mFIREBASE\x1b[32m when running tests`,
  );
  Logger.log(
    `📄 Internal api views are in \x1b[35m${join(__dirname, '..', 'views')}\x1b[0m`
  )
}

bootstrap();




