import { Injectable } from '@nestjs/common';
import { FindUserDTO } from '../../users/dto/user.dto';

@Injectable()
export class JwtInMemoryRegistry {
  private readonly users = new Map<
    string,
    { username: string; email: string; passwordHash: string }
  >();

  async save(
    uid: string,
    username: string,
    email: string,
    passwordHash: string
  ): Promise<void> {
    this.users.set(uid, { username, email, passwordHash });
  }

  findByEmail(email: string): {
    uid: string;
    username: string;
    email: string;
    passwordHash: string;
  } | null {
    const normalized = email.toLowerCase();
    for (const [uid, u] of this.users) {
      if (u.email.toLowerCase() === normalized) {
        return { uid, ...u };
      }
    }
    return null;
  }

  findByUid(uid: string): FindUserDTO | null {
    const u = this.users.get(uid);
    if (!u) {
      return null;
    }
    return new FindUserDTO(uid, u.username);
  }
}
