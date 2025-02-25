import { IUserRepository } from '../../ports/user-repository.interface';
import { CreateUserDto } from '../../dto/user.dto';

export class InMemoryUserRepository implements IUserRepository {
  constructor(public readonly database: CreateUserDto[] = []) {
  }

  async addUsername(user: CreateUserDto): Promise<void> {
    this.database.push(user);
  }
}
