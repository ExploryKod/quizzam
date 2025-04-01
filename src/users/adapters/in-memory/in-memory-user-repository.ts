import { IUserRepository } from '../../ports/user-repository.interface';
import { CreateUserDto, FindUserDTO } from '../../dto/user.dto';
import { User } from '../../entities/user.entity';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  constructor(initialData?: User[]) {
    if (initialData) {
      initialData.forEach((user: User) => {
        this.users.set(user.props.uid || '', user);
      });
    }
  }

  async addUsername(user: CreateUserDto): Promise<void> {
    return
  }

  async findById(id: string): Promise<FindUserDTO | null> {
    return { uid: id, username: "test-user" };
  }
}
