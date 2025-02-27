import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { FirebaseModule } from 'nestjs-firebase';
import { AppService } from './app.service';

import { PingModule } from '../ping/ping.module';

import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/auth.middleware';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../users/user.module';
import { CommonModule } from './common.module';
import { QuizModule } from '../quiz/quiz.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('DATABASE_URL'),
      }),
    }),
    PingModule,
    FirebaseModule.forRoot({
      googleApplicationCredential: 'src/assets/quizzam-firebase-key.json',
    }),
    AuthModule,
    UserModule,
    CommonModule,
    QuizModule
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [FirebaseModule]
})

export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
