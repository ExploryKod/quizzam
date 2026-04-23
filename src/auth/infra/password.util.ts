import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const KEY_LEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) {
    return false;
  }
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  if (keyBuf.length !== derived.length) {
    return false;
  }
  return timingSafeEqual(keyBuf, derived);
}
