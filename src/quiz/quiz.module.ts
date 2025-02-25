import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { CommonModule } from '../core/common.module';
import { MongoUser } from '../users/adapters/mongo/mongo-user';
import { UserModule } from '../users/user.module';

import { MongoQuiz } from './adapters/mongo/mongo-quiz';
import { QuizController } from './controllers/quiz.controller';
import { I_QUIZ_REPOSITORY } from './ports/quiz-repository.interface';

import { FirebaseQuizRepository } from './adapters/firebase/firebase-quiz-repository';

import { GetUserQuizzes } from './commands/get-user-quizzes';

@Module({
  imports: [
    CqrsModule,
    CommonModule,
    UserModule,
    MongooseModule.forFeature([
      {
        name: MongoQuiz.CollectionName,
        schema: MongoQuiz.Schema,
      }
    ]),
  ],
  controllers: [QuizController],
  providers: [
    {
      provide: I_QUIZ_REPOSITORY,
      useClass: FirebaseQuizRepository,  // Use FirebaseQuizRepository as the implementation
    },
    {
      provide: GetUserQuizzes,
      inject: [
        getModelToken(MongoQuiz.CollectionName),
        getModelToken(MongoUser.CollectionName),
        I_QUIZ_REPOSITORY  // Inject the repository
      ],
      useFactory: (quizModel, userModel, repository) => {
        return new GetUserQuizzes(quizModel, userModel, repository);
      },
    },
  ],
  exports: [I_QUIZ_REPOSITORY],
})
export class QuizModule {}
