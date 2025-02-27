import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoUser } from './adapters/mongo/mongo-user';
import { MongoUserRepository } from './adapters/mongo/mongo-user-repository';

import { I_USER_REPOSITORY, IUserRepository } from './ports/user-repository.interface';
import { UsersController } from './controllers/users.controller';
import { FirebaseModule } from 'nestjs-firebase';
import { AddUsername } from './commands/add-username';
import { CqrsModule } from '@nestjs/cqrs';
import { CommonModule } from '../core/common.module';
import { I_QUIZ_REPOSITORY } from '../quiz/ports/quiz-repository.interface';
import { MongoQuizRepository } from '../quiz/adapters/mongo/mongo-quiz-repository';

@Module({
  imports: [
    CqrsModule,
    CommonModule,
    FirebaseModule,
    MongooseModule.forFeature([
      {
        name: MongoUser.CollectionName,
        schema: MongoUser.Schema,
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: I_USER_REPOSITORY,
      useClass: MongoUserRepository,  // Use MongoDBQuizRepository as the implementation
    },
    {
      provide: AddUsername,
      inject: [I_USER_REPOSITORY],
      useFactory: (usersRepository: IUserRepository) => {
        return new AddUsername(usersRepository);
      },
    },
  ],
  exports: [MongooseModule, I_USER_REPOSITORY],
})
export class UserModule {}
