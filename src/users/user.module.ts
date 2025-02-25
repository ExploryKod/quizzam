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
import { OldquizController } from '../quiz/controllers/oldquiz.controller';

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
  controllers: [UsersController, OldquizController],
  providers: [
    {
      provide: I_USER_REPOSITORY,
      inject: [getModelToken(MongoUser.CollectionName)],
      useFactory: (model) => {
        return new MongoUserRepository(model);
      },
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
