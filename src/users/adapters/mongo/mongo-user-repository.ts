import { Model } from 'mongoose';
import { IUserRepository } from '../../ports/user-repository.interface';
import { MongoUser } from './mongo-user';
import { CreateUserDto } from '../../dto/user.dto';

// TODO: supprimer le partial en créant un véritable username séparément dans mongo (comme pour firebase)
export class MongoUserRepository implements IUserRepository {
  constructor(private readonly model: Model<MongoUser.SchemaClass>) {}

  async addUsername(user: CreateUserDto): Promise<void> {
    const record = new this.model(user);
    await record.save();
  }
}
