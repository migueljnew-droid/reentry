import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  ResourceQuerySchema,
  parseOrThrow,
  ValidationError,
} from '@/lib/validation/schemas';

// ─── IntakeSchema ────────────────────────────────────────────────────────────
describe('IntakeSchema', () => {
  const validBase = {
    releaseDate: '2023-06-15',
    releaseState: 'GA',
    convictionType: 'felony' as const,
  };

  it('accepts a valid intake payload', () => {
    const result = IntakeSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejects a future release date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const iso = future.toISOString().slice(0, 10);
    const result = IntakeSchema.safeParse({ ...validBase, releaseDate: iso });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/future/);
    }
  });

  it('rejects a non-date string for releaseDate', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseDate: 'yesterday' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid state code', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseState: 'XX' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('releaseState');
    }
  });

  it('accepts FED as a valid state code', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseState: 'FED' });
    expect(result.success).toBe(true);
  });

  it('coerces state code to uppercase', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseState: 'ga' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.releaseState).toBe('GA');
    }
  });

  it('defaults convictionType to unknown when omitted', () => {
    const { convictionType: _, ...withoutType } = validBase;
    const result = IntakeSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.convictionType).toBe('unknown');
    }
  });

  it('rejects an unknown convictionType value', () => {
    const result = IntakeSchema.safeParse({ ...validBase, convictionType: 'capital' });
    expect(result.success).toBe(false);
  });

  it('accepts optional boolean fields', () => {
    const result = IntakeSchema.safeParse({
      ...validBase,
      hasChildren: true,
      isVeteran: false,
      needsHousing: true,
    });
    expect(result.success).toBe(true);
  });
});

// ─── ResourceQuerySchema ─────────────────────────────────────────────────────
describe('ResourceQuerySchema', () => {
  it('accepts a valid query', () => {
    const result = ResourceQuerySchema.safeParse({ state: 'CA', category: 'housing' });
    expect(result.success).toBe(true);
  });

  it('defaults category to all and limit to 20', () => {
    const result = ResourceQuerySchema.safeParse({ state: 'TN' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('all');
      expect(result.data.limit).toBe(20);
    }
  });

  it('rejects limit > 100', () => {
    const result = ResourceQuerySchema.safeParse({ state: 'GA', limit: 200 });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid state', () => {
    const result = ResourceQuerySchema.safeParse({ state: 'ZZ' });
    expect(result.success).toBe(false);
  });
});

// ─── parseOrThrow ─────────────────────────────────────────────────────────────
describe('parseOrThrow', () => {
  const validIntake = { releaseDate: '2022-01-01', releaseState: 'GA' };

  it('returns typed data on success', () => {
    const data = parseOrThrow(IntakeSchema, validIntake);
    expect(data.releaseState).toBe('GA');
  });

  it('throws ValidationError with statusCode 422 on failure', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { releaseDate: 'bad', releaseState: 'XX' })
    ).toThrow(ValidationError);

    try {
      parseOrThrow(IntakeSchema, { releaseDate: 'bad', releaseState: 'XX' });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      if (err instanceof ValidationError) {
        expect(err.statusCode).toBe(422);
        expect(err.issues.length).toBeGreaterThan(0);
      }
    }
  });

  it('includes path information in issues', () => {
    try {
      parseOrThrow(IntakeSchema, { releaseDate: '2022-01-01', releaseState: 'XX' });
    } catch (err) {
      if (err instanceof ValidationError) {
        const statIssue = err.issues.find((i) => i.path.includes('releaseState'));
        expect(statIssue).toBeDefined();
      }
    }
  });
});
