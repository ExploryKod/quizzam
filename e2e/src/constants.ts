const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ?? '3000';

export const defaultUrl = `http://${host}:${port}`;

/**
 * Web API key (Firebase client / Identity Toolkit). Set via E2E_FIREBASE_WEB_API_KEY — never commit.
 * Only required when e2e helpers run with AUTH_TYPE=FIREBASE.
 */
export function getE2eFirebaseWebApiKey(): string {
  const key = process.env.E2E_FIREBASE_WEB_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'Missing E2E_FIREBASE_WEB_API_KEY. For Firebase e2e: set in quizzam/.env or e2e/.env, or add GitHub secret E2E_FIREBASE_WEB_API_KEY in CI. See e2e/.env.example.'
    );
  }
  return key;
}

export function getE2eFirebaseSignUpUrl(): string {
  return `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${getE2eFirebaseWebApiKey()}`;
}

export function getE2eFirebaseSignInUrl(): string {
  return `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getE2eFirebaseWebApiKey()}`;
}

/** Legacy v3 verifyPassword endpoint (if needed by future tests). */
export function getE2eFirebaseVerifyPasswordUrl(): string {
  return `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=${getE2eFirebaseWebApiKey()}`;
}
