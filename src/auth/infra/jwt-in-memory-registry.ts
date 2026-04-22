import { Injectable } from '@nestjs/common';
import { UserRecord } from '../../users/models';

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

  findByUid(uid: string): UserRecord | null {
    const u = this.users.get(uid);
    if (!u) {
      return null;
    }
    return { uid, username: u.username };
  }
}
