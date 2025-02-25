import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { CommonModule } from '../core/common.module';
import { I_ID_GENERATOR } from '../core/ports/id-generator.interface';
import { MongoUser } from '../users/adapters/mongo/mongo-user';
import { UserModule } from '../users/user.module';

import { MongoQuiz } from './adapters/mongo/mongo-quiz';
import { QuizController } from './controllers/quiz.controller';
import { I_QUIZ_REPOSITORY } from './ports/quiz-repository.interface';
import { MongoQuizRepository } from './adapters/mongo/mongo-quiz-repository';
import { CreateQuiz } from './commands/create-quiz';
import { GetQuizByIdQueryHandler } from './queries/get-quiz-by-id';
import { OldquizController } from './controllers/oldquiz.controller';

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
  controllers: [OldquizController],
  providers: [
    {
      provide: I_QUIZ_REPOSITORY,
      inject: [
        getModelToken(MongoQuiz.CollectionName)
      ],
      useFactory: (model) => {
        return new MongoQuizRepository(model);
      },
    },
    {
      provide: GetQuizByIdQueryHandler,
      inject: [
        getModelToken(MongoQuiz.CollectionName),
        getModelToken(MongoUser.CollectionName),
      ],
      useFactory: (quizModel, userModel) => {
        return new GetQuizByIdQueryHandler(
          quizModel,
          userModel,
        );
      },
    },
    {
      provide: CreateQuiz,
      inject: [I_QUIZ_REPOSITORY, I_ID_GENERATOR],
      useFactory: (repository, idGenerator) => {
        return new CreateQuiz(repository, idGenerator);
      },
    },
  ],
  exports: [I_QUIZ_REPOSITORY],
})
export class QuizModule {}
