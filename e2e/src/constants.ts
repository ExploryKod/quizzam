const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ?? '3000';

export const defaultUrl = `http://${host}:${port}`;

/**
 * Web API key (Firebase client / Identity Toolkit). Set via E2E_FIREBASE_WEB_API_KEY — never commit.
 * Used only when `AUTH_TYPE=FIREBASE` in e2e. With JWT (default), do not set anything — nothing calls this.
 */
export function getE2eFirebaseWebApiKey(): string {
  const key = process.env.E2E_FIREBASE_WEB_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'E2E_FIREBASE_WEB_API_KEY is required only for Firebase e2e (AUTH_TYPE=FIREBASE). Set in .env or GitHub secret, or use JWT e2e without this variable. See e2e/.env.example.'
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
