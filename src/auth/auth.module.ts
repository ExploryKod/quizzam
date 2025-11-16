import { AuthGuard } from './auth.guard';
import { AuthRepository } from './ports/auth.repository';
import { FirebaseAuthRepository } from './infra/firebase-auth.repository';
import { JwtAuthRepository } from './infra/jwt-auth.repository';
import { AuthController } from './controllers/auth.controller';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { variables } from '../shared/variables.config';
import { UserModule } from '../users/user.module';

function getAuthRepository() {
  const authType = process.env.AUTH_TYPE || 'JWT';
  
  switch (authType.toUpperCase()) {
    case 'FIREBASE':
      return FirebaseAuthRepository;
    case 'JWT':
    default:
      return JwtAuthRepository;
  }
}

@Module({
  imports: [ConfigModule, UserModule],
  controllers: [AuthController],
  providers: [
    AuthGuard,
    { provide: AuthRepository, useClass: getAuthRepository() },
    JwtAuthRepository, // Provide JwtAuthRepository separately for AuthController
  ],
  exports: [AuthGuard, AuthRepository],
})
export class AuthModule {}
