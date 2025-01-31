import { Module } from '@nestjs/common';
import { PingController } from 'src/ping/ping.controller';
import { FirebaseModule } from 'nestjs-firebase';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    FirebaseModule.forRoot({
      googleApplicationCredential: 'src/assets/quizzam-firebase-key.json',
    }),
  ],
  controllers: [AppController, PingController],
  providers: [AppService],
})
export class AppModule {}


