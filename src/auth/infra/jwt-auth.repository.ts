import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { UserDetails } from '../model/user-details';
import { AuthRepository } from '../ports/auth.repository';

@Injectable()
export class JwtAuthRepository implements AuthRepository {
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
    
    if (!this.jwtSecret || this.jwtSecret === 'your-secret-key-change-in-production') {
      console.warn('⚠️  Using default JWT_SECRET. Set JWT_SECRET in .env for production!');
    }
  }

  async getUserFromToken(token: string): Promise<UserDetails> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      
      if (!decoded.email || !decoded.uid) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return {
        email: decoded.email as string,
        uid: decoded.uid as string,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async getUserByUid(uid: string): Promise<UserDetails> {
    // For JWT auth, we don't have a user lookup service here
    // This would typically query your user database
    // For now, we'll throw an error - this method might not be used
    throw new Error('getUserByUid not implemented for JWT auth. Use getUserFromToken instead.');
  }

  // Helper method to generate JWT tokens
  generateToken(email: string, uid: string, expiresIn: string = '7d'): string {
    return jwt.sign(
      { email, uid },
      this.jwtSecret,
      { expiresIn }
    );
  }
}

