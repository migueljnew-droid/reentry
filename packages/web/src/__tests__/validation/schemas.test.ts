import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  BenefitsScreeningSchema,
  StateCodeSchema,
  parseOrThrow,
  ValidationError,
} from '@/lib/validation/schemas';

// ── StateCodeSchema ──────────────────────────────────────────────────────────

describe('StateCodeSchema', () => {
  it('accepts valid 2-letter state codes', () => {
    expect(StateCodeSchema.parse('GA')).toBe('GA');
    expect(StateCodeSchema.parse('CA')).toBe('CA');
    expect(StateCodeSchema.parse('TN')).toBe('TN');
  });

  it('accepts FED for federal-only queries', () => {
    expect(StateCodeSchema.parse('FED')).toBe('FED');
  });

  it('normalises lowercase to uppercase', () => {
    expect(StateCodeSchema.parse('ga')).toBe('GA');
  });

  it('rejects invalid state codes', () => {
    expect(() => StateCodeSchema.parse('XX')).toThrow();
    expect(() => StateCodeSchema.parse('')).toThrow();
    expect(() => StateCodeSchema.parse('GEORGIA')).toThrow();
  });
});

// ── IntakeSchema ─────────────────────────────────────────────────────────────

describe('IntakeSchema', () => {
  const valid = {
    releaseDate: '2024-03-15',
    releaseState: 'GA',
  };

  it('accepts a minimal valid payload', () => {
    const result = IntakeSchema.parse(valid);
    expect(result.releaseDate).toBe('2024-03-15');
    expect(result.releaseState).toBe('GA');
    expect(result.voiceMode).toBe(false);
    expect(result.language).toBe('en');
    expect(result.convictionTypes).toEqual([]);
  });

  it('accepts a fully populated payload', () => {
    const result = IntakeSchema.parse({
      ...valid,
      releaseCounty: 'Fulton',
      convictionTypes: ['drug possession'],
      voiceMode: true,
      language: 'es',
    });
    expect(result.releaseCounty).toBe('Fulton');
    expect(result.voiceMode).toBe(true);
    expect(result.language).toBe('es');
  });

  it('rejects a malformed release date', () => {
    expect(() =>
      IntakeSchema.parse({ ...valid, releaseDate: '03/15/2024' })
    ).toThrow();

    expect(() =>
      IntakeSchema.parse({ ...valid, releaseDate: 'not-a-date' })
    ).toThrow();
  });

  it('rejects an invalid state code', () => {
    expect(() =>
      IntakeSchema.parse({ ...valid, releaseState: 'ZZ' })
    ).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => IntakeSchema.parse({ releaseDate: '2024-03-15' })).toThrow();
    expect(() => IntakeSchema.parse({ releaseState: 'GA' })).toThrow();
    expect(() => IntakeSchema.parse({})).toThrow();
  });

  it('rejects convictionTypes arrays that are too long', () => {
    expect(() =>
      IntakeSchema.parse({
        ...valid,
        convictionTypes: Array(21).fill('drug possession'),
      })
    ).toThrow();
  });
});

// ── BenefitsScreeningSchema ──────────────────────────────────────────────────

describe('BenefitsScreeningSchema', () => {
  const valid = {
    state: 'GA',
    householdSize: 2,
    monthlyIncome: 1200,
  };

  it('accepts a valid payload', () => {
    const result = BenefitsScreeningSchema.parse(valid);
    expect(result.state).toBe('GA');
    expect(result.hasChildren).toBe(false);
    expect(result.isVeteran).toBe(false);
  });

  it('rejects negative income', () => {
    expect(() =>
      BenefitsScreeningSchema.parse({ ...valid, monthlyIncome: -1 })
    ).toThrow();
  });

  it('rejects household size of 0', () => {
    expect(() =>
      BenefitsScreeningSchema.parse({ ...valid, householdSize: 0 })
    ).toThrow();
  });
});

// ── parseOrThrow ─────────────────────────────────────────────────────────────

describe('parseOrThrow', () => {
  it('returns typed data on success', () => {
    const data = parseOrThrow(IntakeSchema, {
      releaseDate: '2024-01-01',
      releaseState: 'CA',
    });
    expect(data.releaseState).toBe('CA');
  });

  it('throws ValidationError with statusCode 422 on failure', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { releaseDate: 'bad', releaseState: 'ZZ' })
    ).toThrow(ValidationError);

    try {
      parseOrThrow(IntakeSchema, { releaseDate: 'bad', releaseState: 'ZZ' });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      if (err instanceof ValidationError) {
        expect(err.statusCode).toBe(422);
        expect(err.issues.length).toBeGreaterThan(0);
      }
    }
  });

  it('includes path and message in issues', () => {
    try {
      parseOrThrow(IntakeSchema, { releaseDate: '2024-01-01', releaseState: 'ZZ' });
    } catch (err) {
      if (err instanceof ValidationError) {
        const stateIssue = err.issues.find((i) =>
          i.path.includes('releaseState')
        );
        expect(stateIssue).toBeDefined();
        expect(stateIssue?.message).toMatch(/state code/i);
      }
    }
  });
});
