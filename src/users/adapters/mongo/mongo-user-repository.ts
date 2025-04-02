import { Model } from 'mongoose';
import { IUserRepository } from '../../ports/user-repository.interface';
import { MongoUser } from './mongo-user';
import { CreateUserDto, FindUserDTO } from '../../dto/user.dto';
import { HttpException, HttpStatus, Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';

export class MongoUserRepository implements IUserRepository {
  constructor(
    @Inject(getModelToken(MongoUser.CollectionName)) private readonly model: Model<MongoUser.SchemaClass>,
  ) {}

  async addUsername(user: CreateUserDto): Promise<void> {
    const data = {
      _id: user.uid,
      username: user.username,
    }
    const record = new this.model(data);
    await record.save();
  }

  async findById(id: string): Promise<FindUserDTO | null> {
    console.log(id)
    const record = await this.model.findById(id);
    console.log(record)
    if (!record) {
      throw new HttpException('Utilisateur non trouvé', HttpStatus.NOT_FOUND);
    }

    return new FindUserDTO(record._id, record.username);
  }
}
