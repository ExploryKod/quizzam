import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { MongoUser } from './adapters/mongo/mongo-user';
import { MongoUserRepository } from './adapters/mongo/mongo-user-repository';
import { I_USER_REPOSITORY } from './ports/user-repository.interface';
import { UsersController } from './controllers/users.controller';
import { FirebaseModule } from 'nestjs-firebase';

@Module({
  imports: [
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
      inject: [getModelToken(MongoUser.CollectionName)],
      useFactory: (model) => {
        return new MongoUserRepository(model);
      },
    },
  ],
  exports: [MongooseModule, I_USER_REPOSITORY],
})
export class UserModule {}
