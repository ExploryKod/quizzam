import { Module } from '@nestjs/common';
import { QuizWebSocketGateway } from './host.ws.gateway';
import { QuizSocketGateway } from './host.socket.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [QuizWebSocketGateway, QuizSocketGateway],
})
export class HostModule {}
