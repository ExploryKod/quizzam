import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../core/common.module';
import { UserModule } from '../users/user.module';

import { MongoQuiz } from './adapters/mongo/mongo-quiz';
import { QuizController } from './controllers/quiz.controller';
import { I_QUIZ_REPOSITORY } from './ports/quiz-repository.interface';



import { FirebaseQuizRepository } from './adapters/firebase/firebase-quiz-repository';
import { MongoQuizRepository } from './adapters/mongo/mongo-quiz-repository';

import { variables }from '../shared/variables.config';
import { GetUserQuizzes } from './queries/get-user-quizzes';
import { CreateQuizCommand } from './commands/create-quiz-command';
import { UpdateQuizCommand } from './commands/update-quiz-command'
import { GetQuizByIdQuery } from './queries/get-quiz-by-id';
import { AddQuestionCommand } from './commands/add-question-command';
import { UpdateQuestionCommand } from './commands/update-question-command';
import { DeleteQuizByIdQuery } from './queries/delete-quiz-by-id';
import { StartQuizQuery } from './queries/start-quiz-query';
import { QuizGateway } from './gateways/quiz.gateway';
import { I_QUIZ_GATEWAY } from './ports/quiz-gateway.interface';


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
      useClass: variables.database === "MONGODB" ? MongoQuizRepository : FirebaseQuizRepository,
    },
    {
      provide: I_QUIZ_GATEWAY,
      useClass: QuizGateway,
    },
    {
      provide: GetUserQuizzes,
      inject: [
        I_QUIZ_REPOSITORY,
      ],
      useFactory: (repository) => {
        return new GetUserQuizzes(repository);
      },
    },
    {
      provide: CreateQuizCommand,
      inject: [
        I_QUIZ_REPOSITORY
      ],
      useFactory: (repository) => {
        return new CreateQuizCommand(repository);
      },
    },
    {
      provide: UpdateQuizCommand,
      inject: [
        I_QUIZ_REPOSITORY
      ],
      useFactory: (repository) => {
        return new UpdateQuizCommand(repository);
      },
    },
    {
      provide: AddQuestionCommand,
      inject: [
        I_QUIZ_REPOSITORY
      ],
      useFactory: (repository) => {
        return new AddQuestionCommand(repository);
      },
    },
    {
      provide: UpdateQuestionCommand,
      inject: [
        I_QUIZ_REPOSITORY
      ],
      useFactory: (repository) => {
        return new UpdateQuestionCommand(repository);
      },
    },
    {
      provide: GetQuizByIdQuery,
      inject : [I_QUIZ_REPOSITORY],
      useFactory: (repository) => { return new GetQuizByIdQuery(repository)}
    },
    {
      provide: DeleteQuizByIdQuery,
      inject : [I_QUIZ_REPOSITORY],
      useFactory: (repository) => { return new DeleteQuizByIdQuery(repository)}
    },
    {
      provide: StartQuizQuery,
      inject: [I_QUIZ_REPOSITORY],
      useFactory: (repository) => new StartQuizQuery(repository),
    },
  ],
  exports: [I_QUIZ_REPOSITORY],
})
export class QuizModule {}
