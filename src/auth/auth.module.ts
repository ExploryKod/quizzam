import { AuthGuard } from './auth.guard';
import { AuthRepository } from './ports/auth.repository';
import { FirebaseAuthRepository } from './infra/firebase-auth.repository';
import { JwtAuthRepository } from './infra/jwt-auth.repository';
import { Module } from '@nestjs/common';
import { isFirebaseAuthEnabled } from './config/firebase-env';
import { OptionalFirebaseModule } from './infra/optional-firebase.module';

@Module({
  imports: [OptionalFirebaseModule.register()],
  controllers: [],
  providers: [
    AuthGuard,
    {
      provide: AuthRepository,
      useClass: isFirebaseAuthEnabled()
        ? FirebaseAuthRepository
        : JwtAuthRepository,
    },
    FirebaseAuthRepository,
    JwtAuthRepository,
  ],
  exports: [AuthGuard, AuthRepository],
})
export class AuthModule {}
