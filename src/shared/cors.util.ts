/**
 * Default browser origins: production front (Vercel) + local Angular.
 * Set CORS_ORIGIN in .env to override; use "*" to allow all origins (dev only).
 */
export const DEFAULT_CORS_ORIGIN =
  'https://quizzy-front.vercel.app,http://localhost:4200';

export function getCorsEnvRaw(): string {
  return (process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN).trim();
}

export function isCorsOpenToAll(): boolean {
  const raw = getCorsEnvRaw();
  return raw === '' || raw === '*';
}

/** Nest `enableCors` (HTTP). */
export function getHttpCorsOrigin(): string | string[] {
  if (isCorsOpenToAll()) {
    return '*';
  }
  return getCorsEnvRaw()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Socket.IO `cors.origin` (quiz gateway). */
export function getWebSocketCorsOrigin(): boolean | string | string[] {
  if (isCorsOpenToAll()) {
    return true;
  }
  const list = getCorsEnvRaw()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 1 ? list[0]! : list;
}
