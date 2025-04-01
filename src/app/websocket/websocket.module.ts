import { Module } from '@nestjs/common';
import { FirebaseModule } from 'nestjs-firebase';
import { QuizGateway } from './quiz.gateway';
import { QuizExecutionService } from './quiz-execution.service';

@Module({
  imports: [FirebaseModule],
  providers: [QuizGateway, QuizExecutionService],
})
export class WebSocketModule {}
