import { describe, it, expect } from 'vitest';
import { scrubPII, PII_KEY_PATTERN, REDACTED } from '@/lib/sentry-pii';

// ==========================================
// PII key pattern matching
// ==========================================

describe('PII_KEY_PATTERN', () => {
  const sensitiveKeys = [
    'name', 'fullName', 'full_name', 'userName',
    'conviction', 'convictionType', 'conviction_type',
    'transcript', 'voiceTranscript',
    'supervision', 'supervisionType',
    'ssn', 'SSN',
    'family', 'familyInfo', 'family_details',
  ];

  const safeKeys = [
    'state', 'status', 'id', 'action', 'timestamp',
    'ip_address', 'user_agent', 'method', 'path',
    'error', 'code', 'version', 'tier',
  ];

  it.each(sensitiveKeys)('matches sensitive key: %s', (key) => {
    expect(PII_KEY_PATTERN.test(key)).toBe(true);
  });

  it.each(safeKeys)('does not match safe key: %s', (key) => {
    expect(PII_KEY_PATTERN.test(key)).toBe(false);
  });
});

// ==========================================
// scrubPII function
// ==========================================

describe('scrubPII', () => {
  it('redacts values for PII keys', () => {
    const input = {
      fullName: 'John Doe',
      convictionType: 'nonviolent',
      state: 'GA',
    };
    const result = scrubPII(input);
    expect(result).toEqual({
      fullName: REDACTED,
      convictionType: REDACTED,
      state: 'GA',
    });
  });

  it('preserves non-PII keys', () => {
    const input = {
      status: 'ok',
      version: '0.1.0',
      timestamp: '2026-03-18T12:00:00Z',
    };
    const result = scrubPII(input);
    expect(result).toEqual(input);
  });

  it('recursively scrubs nested objects', () => {
    const input = {
      user: {
        fullName: 'Jane Doe',
        id: '123',
        profile: {
          convictionType: 'felony',
          state: 'CA',
        },
      },
      action: 'generate',
    };
    const result = scrubPII(input);
    expect(result).toEqual({
      user: {
        fullName: REDACTED,
        id: '123',
        profile: {
          convictionType: REDACTED,
          state: 'CA',
        },
      },
      action: 'generate',
    });
  });

  it('leaves arrays as-is (does not recurse into arrays)', () => {
    const input = {
      items: ['name', 'conviction'],
      status: 'ok',
    };
    const result = scrubPII(input);
    expect(result).toEqual({
      items: ['name', 'conviction'],
      status: 'ok',
    });
  });

  it('handles empty object', () => {
    expect(scrubPII({})).toEqual({});
  });

  it('handles object with all PII keys', () => {
    const input = {
      name: 'Test',
      ssn: '123-45-6789',
      familyInfo: { children: 2 },
    };
    const result = scrubPII(input);
    expect(result).toEqual({
      name: REDACTED,
      ssn: REDACTED,
      familyInfo: REDACTED,
    });
  });

  it('handles null and undefined values', () => {
    const input = {
      name: null,
      state: undefined,
      status: 'ok',
    };
    const result = scrubPII(input);
    expect(result).toEqual({
      name: REDACTED,
      state: undefined,
      status: 'ok',
    });
  });

  it('does not mutate the original object', () => {
    const input = {
      name: 'John',
      state: 'GA',
    };
    const original = { ...input };
    scrubPII(input);
    expect(input).toEqual(original);
  });
});
