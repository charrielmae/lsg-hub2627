import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plain, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPasswordHash(
  plain: string,
  storedHash: string | null | undefined,
): boolean {
  if (!storedHash) return false;

  if (storedHash.startsWith('scrypt:')) {
    const [, salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = scryptSync(plain, salt, expected.length);
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  if (storedHash.startsWith('sha256:')) {
    const [, salt, digestHex] = storedHash.split(':');
    if (!salt || !digestHex) return false;
    const expected = Buffer.from(digestHex, 'hex');
    const actual = Buffer.from(
      createHash('sha256').update(`${salt}:${plain}`).digest('hex'),
      'hex',
    );
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  return false;
}
