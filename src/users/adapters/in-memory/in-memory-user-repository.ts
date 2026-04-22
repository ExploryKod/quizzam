import { Injectable, Optional } from '@nestjs/common';
import { IUserRepository } from '../../ports/user-repository.interface';
import { CreateUserDto, FindUserDTO } from '../../dto/user.dto';
import { User } from '../../entities/user.entity';
import { JwtInMemoryRegistry } from '../../../auth/infra/jwt-in-memory-registry';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  constructor(
    @Optional() private readonly jwtRegistry?: JwtInMemoryRegistry,
    initialData?: User[]
  ) {
    if (initialData) {
      initialData.forEach((user: User) => {
        this.users.set(user.props.uid || '', user);
      });
    }
  }

  async addUsername(user: CreateUserDto): Promise<void> {
    return;
  }

  async findById(id: string): Promise<FindUserDTO | null> {
    const fromJwt = this.jwtRegistry?.findByUid(id);
    if (fromJwt) {
      return fromJwt;
    }
    return { uid: id, username: 'test-user' };
  }
}
