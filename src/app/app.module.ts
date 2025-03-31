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
import { QuizModule } from './quiz/quiz.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    PingModule,
    FirebaseModule.forRoot({
      googleApplicationCredential: 'src/assets/quizzam-firebase-key.json',
    }),
    AuthModule,
    QuizModule,
    WebSocketModule,
  ],
  controllers: [AppController, PingoController, UsersController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
