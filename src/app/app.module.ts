import { Module } from '@nestjs/common';
import { PingoController } from 'src/pingo/pingo.controller';
import { FirebaseModule } from 'nestjs-firebase';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingModule } from './ping/ping.module';

@Module({
  imports: [
    PingModule,
    FirebaseModule.forRoot({
      googleApplicationCredential: 'src/assets/quizzam-firebase-key.json',
    }),
  ],
  controllers: [AppController, PingoController],
  providers: [AppService],
})
export class AppModule {}


