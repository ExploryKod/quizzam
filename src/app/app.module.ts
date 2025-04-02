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
import { PingModule } from './ping/ping.module';
import { UsersController } from './users/users.controller';
import { AuthModule } from './modules/auth/auth.module';
import { AuthMiddleware } from './modules/auth/auth.middleware';
import { QuizController } from './quiz/quiz.controller';
import { TestController } from './test/test.controller';

@Module({
  imports: [
    PingModule,
    FirebaseModule.forRoot({
      googleApplicationCredential: 'src/assets/quizzam-firebase-key.json',
    }),
    AuthModule,
  ],
  controllers: [
    AppController,
    PingoController,
    UsersController,
    QuizController,
    TestController
  ],
  providers: [AppService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
