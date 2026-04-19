import { DynamicModule, Global, Module } from '@nestjs/common';
import { FirebaseModule } from 'nestjs-firebase';
import {
  getFirebaseCredentialPath,
  isFirebaseRequired,
} from '../config/firebase-env';

/**
 * Adaptateur Nest pour firebase-admin (SDK Google), enregistré depuis AuthModule.
 * Ce n’est pas un bounded context « Firebase » : c’est de l’infrastructure partagée
 * (auth Firebase + dépôts Firestore côté users/quiz quand DATABASE_NAME=FIREBASE).
 */
const FIREBASE_DISABLED_ERROR =
  'Firebase Admin is disabled. Set AUTH_TYPE=FIREBASE and/or DATABASE_NAME=FIREBASE and configure FIREBASE_KEY_PATH to enable it.';

function createThrowingProxy(): object {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(FIREBASE_DISABLED_ERROR);
      },
    }
  );
}

const disabledFirebaseAdmin = {
  auth: createThrowingProxy(),
  firestore: createThrowingProxy(),
  messaging: createThrowingProxy(),
  remoteConfig: createThrowingProxy(),
  storage: createThrowingProxy(),
};

@Global()
@Module({})
export class OptionalFirebaseModule {
  static register(): DynamicModule {
    if (isFirebaseRequired()) {
      return FirebaseModule.forRoot({
        googleApplicationCredential: getFirebaseCredentialPath(),
      });
    }

    return {
      module: OptionalFirebaseModule,
      exports: ['FIREBASE_TOKEN'],
      providers: [
        {
          provide: 'FIREBASE_TOKEN',
          useValue: disabledFirebaseAdmin,
        },
      ],
    };
  }
}
