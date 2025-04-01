import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoUser } from './adapters/mongo/mongo-user';
import { MongoUserRepository } from './adapters/mongo/mongo-user-repository';

import { I_USER_REPOSITORY, IUserRepository } from './ports/user-repository.interface';
import { UsersController } from './controllers/users.controller';
import { FirebaseModule } from 'nestjs-firebase';
import { AddUsername } from './commands/add-username';
import { CqrsModule } from '@nestjs/cqrs';
import { CommonModule } from '../core/common.module';
import { variables } from '../shared/variables.config';
import { FirebaseUserRepository } from './adapters/firebase/firebase-user-repository';
import { GetUserByIdQuery } from './queries/get-user-by-id';
import { InMemoryUserRepository } from './adapters/in-memory/in-memory-user-repository';

function database(database: string) {
  switch (database) {
    case "MONGODB" :
      return MongoUserRepository
    case "FIREBASE":
      return FirebaseUserRepository
    case "IN-MEMORY":
      return InMemoryUserRepository
  }
}

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
      useClass: database(variables.database),
    },
    {
      provide: AddUsername,
      inject: [I_USER_REPOSITORY],
      useFactory: (repository: IUserRepository) => {
        return new AddUsername(repository);
      },
    },
    {
      provide: GetUserByIdQuery,
      inject : [I_USER_REPOSITORY],
      useFactory: (repository) => { return new GetUserByIdQuery(repository)}
    },
  ],
  exports: [MongooseModule, I_USER_REPOSITORY],
})
export class UserModule {}
