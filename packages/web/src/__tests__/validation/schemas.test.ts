import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  ResourceQuerySchema,
  parseOrThrow,
  ValidationError,
  StateCodeSchema,
} from '../../lib/validation/schemas';

// ─── StateCodeSchema ─────────────────────────────────────────────────────────
describe('StateCodeSchema', () => {
  it('accepts valid 2-letter state codes', () => {
    expect(StateCodeSchema.parse('GA')).toBe('GA');
    expect(StateCodeSchema.parse('CA')).toBe('CA');
    expect(StateCodeSchema.parse('FED')).toBe('FED');
  });

  it('uppercases lowercase input', () => {
    expect(StateCodeSchema.parse('ga')).toBe('GA');
  });

  it('rejects invalid codes', () => {
    expect(() => StateCodeSchema.parse('XX')).toThrow();
    expect(() => StateCodeSchema.parse('')).toThrow();
    expect(() => StateCodeSchema.parse('Georgia')).toThrow();
  });
});

// ─── IntakeSchema ─────────────────────────────────────────────────────────────
describe('IntakeSchema', () => {
  const validIntake = {
    releaseDate: '2024-03-15',
    releaseState: 'GA',
  };

  it('accepts a minimal valid intake', () => {
    const result = IntakeSchema.parse(validIntake);
    expect(result.releaseDate).toBe('2024-03-15');
    expect(result.releaseState).toBe('GA');
    expect(result.preferredLanguage).toBe('en'); // default
    expect(result.convictionTypes).toEqual([]); // default
  });

  it('accepts a fully populated intake', () => {
    const result = IntakeSchema.parse({
      ...validIntake,
      currentZip: '30303',
      convictionTypes: ['drug possession'],
      hasChildren: true,
      needsHousing: true,
      needsEmployment: true,
      needsBenefits: false,
      needsIdReplacement: true,
      preferredLanguage: 'es',
    });
    expect(result.preferredLanguage).toBe('es');
    expect(result.currentZip).toBe('30303');
  });

  it('rejects an invalid release date format', () => {
    expect(() =>
      IntakeSchema.parse({ ...validIntake, releaseDate: '03/15/2024' })
    ).toThrow();
  });

  it('rejects a non-existent calendar date', () => {
    expect(() =>
      IntakeSchema.parse({ ...validIntake, releaseDate: '2024-13-99' })
    ).toThrow();
  });

  it('rejects an invalid state code', () => {
    expect(() =>
      IntakeSchema.parse({ ...validIntake, releaseState: 'XX' })
    ).toThrow();
  });

  it('rejects an invalid ZIP code', () => {
    expect(() =>
      IntakeSchema.parse({ ...validIntake, currentZip: '1234' })
    ).toThrow();
  });

  it('rejects an unsupported language', () => {
    expect(() =>
      IntakeSchema.parse({ ...validIntake, preferredLanguage: 'de' })
    ).toThrow();
  });

  it('rejects more than 20 conviction types', () => {
    expect(() =>
      IntakeSchema.parse({
        ...validIntake,
        convictionTypes: Array(21).fill('drug possession'),
      })
    ).toThrow();
  });
});

// ─── ResourceQuerySchema ──────────────────────────────────────────────────────
describe('ResourceQuerySchema', () => {
  const validQuery = {
    state: 'GA',
    categories: ['housing', 'employment'],
  };

  it('accepts a valid query with defaults', () => {
    const result = ResourceQuerySchema.parse(validQuery);
    expect(result.radiusMiles).toBe(25);
    expect(result.state).toBe('GA');
  });

  it('rejects an empty categories array', () => {
    expect(() =>
      ResourceQuerySchema.parse({ ...validQuery, categories: [] })
    ).toThrow();
  });

  it('rejects an invalid category', () => {
    expect(() =>
      ResourceQuerySchema.parse({ ...validQuery, categories: ['nightclub'] })
    ).toThrow();
  });

  it('rejects radius > 100', () => {
    expect(() =>
      ResourceQuerySchema.parse({ ...validQuery, radiusMiles: 101 })
    ).toThrow();
  });
});

// ─── parseOrThrow ─────────────────────────────────────────────────────────────
describe('parseOrThrow', () => {
  it('returns typed data on success', () => {
    const result = parseOrThrow(IntakeSchema, {
      releaseDate: '2024-06-01',
      releaseState: 'TN',
    });
    expect(result.releaseState).toBe('TN');
  });

  it('throws ValidationError with structured issues on failure', () => {
    let caught: unknown;
    try {
      parseOrThrow(IntakeSchema, { releaseDate: 'bad', releaseState: 'XX' });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ValidationError);
    const err = caught as ValidationError;
    expect(err.statusCode).toBe(422);
    expect(Array.isArray(err.issues)).toBe(true);
    expect(err.issues.length).toBeGreaterThan(0);
    expect(err.issues[0]).toHaveProperty('path');
    expect(err.issues[0]).toHaveProperty('message');
    expect(err.issues[0]).toHaveProperty('code');
  });
});
