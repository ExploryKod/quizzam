const FIREBASE_AUTH_TYPE = 'FIREBASE';
const FIREBASE_DATABASE_NAME = 'FIREBASE';
const DEFAULT_FIREBASE_KEY_PATH = 'src/assets/quizzam-firebase-key.json';

function normalizeEnvValue(value?: string): string {
  return value?.trim().toUpperCase() ?? '';
}

export function getAuthType(): string {
  return normalizeEnvValue(process.env.AUTH_TYPE);
}

export function getDatabaseName(): string {
  return normalizeEnvValue(process.env.DATABASE_NAME);
}

export function isFirebaseAuthEnabled(): boolean {
  return getAuthType() === FIREBASE_AUTH_TYPE;
}

export function isFirebaseDatabaseEnabled(): boolean {
  return getDatabaseName() === FIREBASE_DATABASE_NAME;
}

/** Charge firebase-admin (auth + Firestore) seulement si auth Firebase ou BDD Firebase. */
export function isFirebaseRequired(): boolean {
  return isFirebaseAuthEnabled() || isFirebaseDatabaseEnabled();
}

export function getFirebaseCredentialPath(): string {
  return process.env.FIREBASE_KEY_PATH?.trim() || DEFAULT_FIREBASE_KEY_PATH;
}
