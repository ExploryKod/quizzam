import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { sign } from 'jsonwebtoken';
import { MongoUser } from '../../users/adapters/mongo/mongo-user';
import { variables } from '../../shared/variables.config';
import { hashPassword, verifyPassword } from '../infra/password.util';
import { JwtInMemoryRegistry } from '../infra/jwt-in-memory-registry';

export interface JwtAuthResponseBody {
  token: string;
  user: { email: string; uid: string; username: string };
}

@Injectable()
export class JwtCredentialsService {
  constructor(
    private readonly jwtRegistry: JwtInMemoryRegistry,
    @Optional()
    @Inject(getModelToken(MongoUser.CollectionName))
    private readonly userModel?: Model<MongoUser.SchemaClass>
  ) {}

  async register(input: {
    username: string;
    email: string;
    password: string;
  }): Promise<JwtAuthResponseBody> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.username?.trim() || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    if (variables.database === 'MONGODB') {
      return this.registerMongo(email, input.username.trim(), input.password);
    }

    if (variables.database === 'IN-MEMORY') {
      return this.registerInMemory(email, input.username.trim(), input.password);
    }

    throw new InternalServerErrorException(
      'JWT register is only supported with DATABASE_NAME=MONGODB or IN-MEMORY'
    );
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<JwtAuthResponseBody> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    if (variables.database === 'MONGODB') {
      return this.loginMongo(email, input.password);
    }

    if (variables.database === 'IN-MEMORY') {
      return this.loginInMemory(email, input.password);
    }

    throw new InternalServerErrorException(
      'JWT login is only supported with DATABASE_NAME=MONGODB or IN-MEMORY'
    );
  }

  private async registerMongo(
    email: string,
    username: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);

    try {
      await this.userModel.create({
        _id: uid,
        username,
        email,
        passwordHash,
      });
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
    };
  }

  private async loginMongo(
    email: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }

    const doc = await this.userModel.findOne({ email });
    if (!doc?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(password, doc.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.signToken(doc._id, doc.email ?? email),
      user: {
        email: doc.email ?? email,
        uid: doc._id,
        username: doc.username,
      },
    };
  }

  private async registerInMemory(
    email: string,
    username: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (this.jwtRegistry.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);
    await this.jwtRegistry.save(uid, username, email, passwordHash);

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
    };
  }

  private async loginInMemory(
    email: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    const row = this.jwtRegistry.findByEmail(email);
    if (!row) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.signToken(row.uid, row.email),
      user: {
        email: row.email,
        uid: row.uid,
        username: row.username,
      },
    };
  }

  private signToken(uid: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    return sign(
      { user_id: uid, uid, email, sub: uid },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}
