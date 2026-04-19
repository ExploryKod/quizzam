import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload, verify } from 'jsonwebtoken';
import { UserDetails } from '../model/user-details';
import type { AuthRepository } from '../ports/auth.repository';

type SupportedJwtPayload = JwtPayload & {
  uid?: string;
  user_id?: string;
  sub?: string;
  email?: string;
};

@Injectable()
export class JwtAuthRepository implements AuthRepository {
  async getUserFromToken(token: string): Promise<UserDetails> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    const payload = verify(token, secret) as SupportedJwtPayload;
    const uid = payload.uid || payload.user_id || payload.sub;

    if (!uid) {
      throw new UnauthorizedException('JWT token does not contain a user id');
    }

    return {
      email: payload.email ?? '',
      uid,
    };
  }

  async getUserByUid(uid: string): Promise<UserDetails> {
    return {
      email: '',
      uid,
    };
  }
}
