import { Body, Controller, HttpException, HttpStatus, Post, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { JwtAuthRepository } from '../infra/jwt-auth.repository';
import { I_USER_REPOSITORY, IUserRepository } from '../../users/ports/user-repository.interface';

export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  email: string;
  password: string;
  username: string;
}

export class AuthResponseDto {
  token: string;
  user: {
    email: string;
    uid: string;
    username?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtAuthRepository: JwtAuthRepository,
    @Inject(I_USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    if (this.userRepository.findByEmail) {
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Generate UID (you might want to use UUID)
    const uid = this.generateUid();

    // Create user in database
    if (!this.userRepository.create) {
      throw new HttpException('User repository does not support user creation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    try {
      await this.userRepository.create({
        uid,
        username: registerDto.username,
        email: registerDto.email,
        password: hashedPassword,
      });
    } catch (error) {
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Generate JWT token
    const token = this.jwtAuthRepository.generateToken(registerDto.email, uid);

    return {
      token,
      user: {
        email: registerDto.email,
        uid,
        username: registerDto.username,
      },
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    if (!this.userRepository.findByEmail) {
      throw new HttpException('User repository does not support email lookup', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let user;
    try {
      user = await this.userRepository.findByEmail(loginDto.email);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtAuthRepository.generateToken(user.email, user.uid);

    return {
      token,
      user: {
        email: user.email,
        uid: user.uid,
        username: user.username,
      },
    };
  }

  private generateUid(): string {
    // Simple UID generation - you might want to use UUID library
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

