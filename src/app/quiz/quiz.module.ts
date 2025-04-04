import { Module } from '@nestjs/common';
import { QuizController } from './controllers/quiz.controller';
import { QuizService } from './services/quiz.service';
import { QuizRepository } from './ports/quiz.repository';
import { FirebaseQuizRepository } from './infra/firebase-quiz.repository';

@Module({
  controllers: [QuizController],
  providers: [
    QuizService,
    {
      provide: QuizRepository,
      useClass: FirebaseQuizRepository,
    },
  ],
  exports: [QuizService],
})
export class QuizModule {}
