import { describe, it, expect, afterAll } from 'vitest';
import { randomBytes } from 'crypto';
import {
  encryptField,
  decryptField,
  encryptJsonField,
  decryptJsonField,
  isEncrypted,
  getEncryptionKey,
} from '@/lib/crypto';

const TEST_KEY = randomBytes(32);
const WRONG_KEY = randomBytes(32);

// ==========================================
// encryptField / decryptField roundtrip
// ==========================================

describe('encryptField + decryptField', () => {
  it('roundtrips a simple string', () => {
    const plaintext = 'nonviolent drug offense';
    const encrypted = encryptField(plaintext, TEST_KEY);
    const decrypted = decryptField(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('roundtrips unicode characters', () => {
    const plaintext = 'Delito no violento — ofensa de drogas';
    const encrypted = encryptField(plaintext, TEST_KEY);
    const decrypted = decryptField(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('roundtrips an empty string (passthrough)', () => {
    const encrypted = encryptField('', TEST_KEY);
    expect(encrypted).toBe('');
    const decrypted = decryptField('', TEST_KEY);
    expect(decrypted).toBe('');
  });

  it('roundtrips a long string', () => {
    const plaintext = 'x'.repeat(10000);
    const encrypted = encryptField(plaintext, TEST_KEY);
    const decrypted = decryptField(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('produces output in iv:authTag:ciphertext format', () => {
    const encrypted = encryptField('test', TEST_KEY);
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    // IV should be 12 bytes = 16 base64 chars
    expect(Buffer.from(parts[0], 'base64').length).toBe(12);
    // Auth tag should be 16 bytes
    expect(Buffer.from(parts[1], 'base64').length).toBe(16);
    // Ciphertext should be non-empty
    expect(parts[2].length).toBeGreaterThan(0);
  });
});

// ==========================================
// Unique IVs per encryption
// ==========================================

describe('IV uniqueness', () => {
  it('generates unique IVs for each call', () => {
    const plaintext = 'same input';
    const enc1 = encryptField(plaintext, TEST_KEY);
    const enc2 = encryptField(plaintext, TEST_KEY);
    const enc3 = encryptField(plaintext, TEST_KEY);

    // All three should decrypt to the same value
    expect(decryptField(enc1, TEST_KEY)).toBe(plaintext);
    expect(decryptField(enc2, TEST_KEY)).toBe(plaintext);
    expect(decryptField(enc3, TEST_KEY)).toBe(plaintext);

    // But all three ciphertexts should be different (different IVs)
    expect(enc1).not.toBe(enc2);
    expect(enc2).not.toBe(enc3);
    expect(enc1).not.toBe(enc3);

    // Specifically, the IVs (first part) should differ
    const iv1 = enc1.split(':')[0];
    const iv2 = enc2.split(':')[0];
    const iv3 = enc3.split(':')[0];
    expect(iv1).not.toBe(iv2);
    expect(iv2).not.toBe(iv3);
  });
});

// ==========================================
// Wrong key throws
// ==========================================

describe('wrong key rejection', () => {
  it('throws when decrypting with wrong key', () => {
    const encrypted = encryptField('secret data', TEST_KEY);
    expect(() => decryptField(encrypted, WRONG_KEY)).toThrow();
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encryptField('secret data', TEST_KEY);
    const parts = encrypted.split(':');
    // Tamper with the ciphertext part
    const tamperedCiphertext = Buffer.from(parts[2], 'base64');
    tamperedCiphertext[0] ^= 0xff;
    const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext.toString('base64')}`;
    expect(() => decryptField(tampered, TEST_KEY)).toThrow();
  });

  it('throws on tampered auth tag', () => {
    const encrypted = encryptField('secret data', TEST_KEY);
    const parts = encrypted.split(':');
    // Tamper with the auth tag
    const tamperedTag = Buffer.from(parts[1], 'base64');
    tamperedTag[0] ^= 0xff;
    const tampered = `${parts[0]}:${tamperedTag.toString('base64')}:${parts[2]}`;
    expect(() => decryptField(tampered, TEST_KEY)).toThrow();
  });
});

// ==========================================
// Key validation
// ==========================================

describe('key validation', () => {
  it('throws on wrong key length (16 bytes)', () => {
    const shortKey = randomBytes(16);
    expect(() => encryptField('test', shortKey)).toThrow('Encryption key must be exactly 32 bytes');
  });

  it('throws on wrong key length for decrypt', () => {
    const shortKey = randomBytes(16);
    expect(() => decryptField('a:b:c', shortKey)).toThrow('Encryption key must be exactly 32 bytes');
  });
});

// ==========================================
// Invalid ciphertext format
// ==========================================

describe('invalid ciphertext', () => {
  it('throws on malformed ciphertext (no colons)', () => {
    expect(() => decryptField('notvalidciphertext', TEST_KEY)).toThrow('Invalid ciphertext format');
  });

  it('throws on ciphertext with wrong number of parts', () => {
    expect(() => decryptField('a:b:c:d', TEST_KEY)).toThrow('Invalid ciphertext format');
  });

  it('throws on invalid IV length', () => {
    const shortIv = randomBytes(8).toString('base64');
    const tag = randomBytes(16).toString('base64');
    const data = randomBytes(10).toString('base64');
    expect(() => decryptField(`${shortIv}:${tag}:${data}`, TEST_KEY)).toThrow('Invalid IV length');
  });
});

// ==========================================
// JSON field encryption
// ==========================================

describe('encryptJsonField + decryptJsonField', () => {
  it('roundtrips a JSONB object', () => {
    const data = {
      hasChildren: true,
      numberOfChildren: 3,
      childAges: [2, 5, 8],
      custodyStatus: 'partial',
    };
    const encrypted = encryptJsonField(data, TEST_KEY);
    const decrypted = decryptJsonField(encrypted, TEST_KEY);
    expect(decrypted).toEqual(data);
  });

  it('roundtrips an empty object', () => {
    const data = {};
    const encrypted = encryptJsonField(data, TEST_KEY);
    const decrypted = decryptJsonField(encrypted, TEST_KEY);
    expect(decrypted).toEqual(data);
  });

  it('roundtrips supervision terms', () => {
    const terms = {
      type: 'parole',
      officer: 'Officer Smith',
      checkInFrequency: 'weekly',
      conditions: ['no alcohol', 'curfew 10pm', 'employment required'],
    };
    const encrypted = encryptJsonField(terms, TEST_KEY);
    const decrypted = decryptJsonField(encrypted, TEST_KEY);
    expect(decrypted).toEqual(terms);
  });
});

// ==========================================
// isEncrypted helper
// ==========================================

describe('isEncrypted', () => {
  it('returns true for encrypted values', () => {
    const encrypted = encryptField('test', TEST_KEY);
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(isEncrypted('nonviolent')).toBe(false);
    expect(isEncrypted('just a regular string')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isEncrypted('')).toBe(false);
  });

  it('returns false for JSON string', () => {
    expect(isEncrypted('{"key":"value"}')).toBe(false);
  });
});

// ==========================================
// getEncryptionKey
// ==========================================

describe('getEncryptionKey', () => {
  const originalEnv = process.env.REENTRY_ENCRYPTION_KEY;

  it('throws when env var is not set', () => {
    delete process.env.REENTRY_ENCRYPTION_KEY;
    expect(() => getEncryptionKey()).toThrow('REENTRY_ENCRYPTION_KEY environment variable is not set');
  });

  it('throws when env var has wrong length', () => {
    process.env.REENTRY_ENCRYPTION_KEY = 'aabbccdd'; // too short
    expect(() => getEncryptionKey()).toThrow('64-character hex string');
  });

  it('returns 32-byte buffer for valid key', () => {
    process.env.REENTRY_ENCRYPTION_KEY = TEST_KEY.toString('hex');
    const key = getEncryptionKey();
    expect(key.length).toBe(32);
    expect(Buffer.compare(key, TEST_KEY)).toBe(0);
  });

  // Restore env
  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env.REENTRY_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.REENTRY_ENCRYPTION_KEY;
    }
  });
});
