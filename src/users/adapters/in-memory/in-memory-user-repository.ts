import { Injectable, Optional } from '@nestjs/common';
import { IUserRepository } from '../../ports/user-repository.interface';
import { UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
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

  async addUsername(user: CreateUserProfilePayload): Promise<void> {
    return;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const fromJwt = this.jwtRegistry?.findByUid(id);
    if (fromJwt) {
      return fromJwt;
    }
    return { uid: id, username: 'test-user' };
  }
}
