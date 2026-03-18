import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Load the encryption key from environment variable.
 * REENTRY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).
 */
export function getEncryptionKey(): Buffer {
  const hexKey = process.env.REENTRY_ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error('REENTRY_ENCRYPTION_KEY environment variable is not set');
  }
  if (hexKey.length !== 64) {
    throw new Error('REENTRY_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hexKey, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: base64(iv):base64(authTag):base64(ciphertext)
 * Each call generates a unique random IV.
 */
export function encryptField(plaintext: string, key: Buffer): string {
  if (!plaintext) return plaintext;
  if (key.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt a ciphertext string produced by encryptField.
 * Expects format: base64(iv):base64(authTag):base64(ciphertext)
 */
export function decryptField(ciphertext: string, key: Buffer): string {
  if (!ciphertext) return ciphertext;
  if (key.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes');
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format — expected iv:authTag:ciphertext');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = Buffer.from(parts[2], 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Encrypt a JSONB field (object) — stringify, encrypt, return ciphertext string.
 */
export function encryptJsonField(data: Record<string, unknown>, key: Buffer): string {
  return encryptField(JSON.stringify(data), key);
}

/**
 * Decrypt a JSONB field — decrypt ciphertext, parse JSON, return object.
 */
export function decryptJsonField(ciphertext: string, key: Buffer): Record<string, unknown> {
  const decrypted = decryptField(ciphertext, key);
  return JSON.parse(decrypted);
}

/**
 * Check if a string value is encrypted (matches iv:authTag:ciphertext format).
 * Used to handle migration — unencrypted legacy data will not have this format.
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}
