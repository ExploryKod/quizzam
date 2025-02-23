import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PingoController } from 'src/pingo/pingo.controller';
import { FirebaseModule } from 'nestjs-firebase';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingModule } from '../ping/ping.module';
import { UsersController } from '../users/users.controller';
import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/auth.middleware';
import { QuizController } from '../quiz/quiz.controller';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// import { APP_GUARD } from '@nestjs/core';
import { I_USER_REPOSITORY } from '../users/ports/user-repository.interface';
import { Authenticator } from '../users/services/authenticator';
import { UserModule } from '../users/user.module';
// import { AuthGuard } from './auth.guard';
import { CommonModule } from './common.module';

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
  ],
  controllers: [
    AppController,
    PingoController,
    UsersController,
    QuizController,
  ],
  providers: [AppService,
    {
      provide: Authenticator,
      inject: [I_USER_REPOSITORY],
      useFactory: (repository) => {
        return new Authenticator(repository);
      },
    },
    // {
    //   provide: APP_GUARD,
    //   inject: [Authenticator],
    //   useFactory: (authenticator) => {
    //     return new AuthGuard(authenticator);
    //   },
    // },
  ],
})

export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
