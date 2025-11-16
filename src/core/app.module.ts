import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { FirebaseModule } from 'nestjs-firebase';
import { AppService } from './app.service';

import { PingModule } from '../ping/ping.module';

import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/auth.middleware';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../users/user.module';
import { CommonModule } from './common.module';
import { QuizModule } from '../quiz/quiz.module';
import { AppController } from './app.controller';
import { ChatModule } from '../chat/chat.module';
import { HostModule } from '../host/host.module';
import { variables } from '../shared/variables.config';
import { existsSync } from 'fs';
import { join } from 'path';

// Get Firebase key path from env or use default
const firebaseKeyPath = process.env.FIREBASE_KEY_PATH || 'src/assets/quizzam-firebase-key.json';
const absoluteFirebaseKeyPath = join(process.cwd(), firebaseKeyPath);

// Firebase is only needed if using Firebase auth or Firebase database
const getFirebaseConfig = () => {
  const authType = process.env.AUTH_TYPE || 'JWT';
  const useFirebaseAuth = authType.toUpperCase() === 'FIREBASE';
  const useFirebaseDb = variables.database === 'FIREBASE';
  
  // Skip Firebase if using JWT auth and MongoDB
  if (!useFirebaseAuth && !useFirebaseDb) {
    return null; // Don't initialize Firebase
  }
  
  // Check if file exists at the configured path
  if (existsSync(absoluteFirebaseKeyPath)) {
    return {
      googleApplicationCredential: absoluteFirebaseKeyPath,
    };
  }
  
  // Try GOOGLE_APPLICATION_CREDENTIALS environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const envCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (existsSync(envCredPath)) {
      return {
        googleApplicationCredential: envCredPath,
      };
    }
  }
  
  // File not found - throw error with helpful message
  const errorMessage = useFirebaseDb
    ? `Firebase key file not found at ${absoluteFirebaseKeyPath}. ` +
      `Required when DATABASE_NAME=FIREBASE. ` +
      `Set FIREBASE_KEY_PATH env var or place the file at the default location.`
    : `Firebase key file not found at ${absoluteFirebaseKeyPath}. ` +
      `Firebase is required when AUTH_TYPE=FIREBASE. ` +
      `Options:\n` +
      `  1. Set AUTH_TYPE=JWT to use JWT authentication instead\n` +
      `  2. Place quizzam-firebase-key.json in src/assets/\n` +
      `  3. Set FIREBASE_KEY_PATH env var to the file path\n` +
      `  4. Set GOOGLE_APPLICATION_CREDENTIALS env var to the file path`;
  
  throw new Error(errorMessage);
};

const firebaseConfig = getFirebaseConfig();

// Build imports array conditionally
const buildImports = () => {
  const imports: any[] = [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('DATABASE_URL'),
      }),
    }),
    PingModule,
    AuthModule,
    UserModule,
    CommonModule,
    QuizModule,
    ChatModule
  ];
  
  if (firebaseConfig) {
    imports.splice(2, 0, FirebaseModule.forRoot(firebaseConfig));
  }
  
  return imports;
};

@Module({
  imports: buildImports(),
  controllers: [AppController],
  providers: [AppService],
  exports: firebaseConfig ? [FirebaseModule] : []
})

export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
