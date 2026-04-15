import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  BenefitsScreeningSchema,
  parseOrThrow,
  ValidationError,
} from '@/lib/validation/schemas';

// ---------------------------------------------------------------------------
// IntakeSchema
// ---------------------------------------------------------------------------

describe('IntakeSchema', () => {
  const valid = {
    releaseDate: '2024-06-01',
    releaseState: 'GA',
    convictionType: 'felony',
    housingStatus: 'shelter',
  };

  it('accepts a minimal valid intake', () => {
    const result = parseOrThrow(IntakeSchema, valid);
    expect(result.releaseState).toBe('GA');
    expect(result.skills).toEqual([]);
  });

  it('accepts optional fields', () => {
    const result = parseOrThrow(IntakeSchema, {
      ...valid,
      hasChildren: true,
      hasDisability: false,
      skills: ['forklift', 'welding'],
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.skills).toHaveLength(2);
    expect(result.hasChildren).toBe(true);
  });

  it('normalises state code to uppercase', () => {
    const result = parseOrThrow(IntakeSchema, { ...valid, releaseState: 'ga' });
    expect(result.releaseState).toBe('GA');
  });

  it('accepts FED as a valid state code', () => {
    const result = parseOrThrow(IntakeSchema, { ...valid, releaseState: 'FED' });
    expect(result.releaseState).toBe('FED');
  });

  it('rejects an invalid state code', () => {
    expect(() => parseOrThrow(IntakeSchema, { ...valid, releaseState: 'XX' }))
      .toThrow(ValidationError);
  });

  it('rejects a malformed release date', () => {
    expect(() => parseOrThrow(IntakeSchema, { ...valid, releaseDate: '06/01/2024' }))
      .toThrow(ValidationError);
  });

  it('rejects an impossible calendar date', () => {
    expect(() => parseOrThrow(IntakeSchema, { ...valid, releaseDate: '2024-13-99' }))
      .toThrow(ValidationError);
  });

  it('rejects an unknown conviction type', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...valid, convictionType: 'capital' })
    ).toThrow(ValidationError);
  });

  it('rejects more than 20 skills', () => {
    const skills = Array.from({ length: 21 }, (_, i) => `skill-${i}`);
    expect(() => parseOrThrow(IntakeSchema, { ...valid, skills })).toThrow(ValidationError);
  });

  it('exposes structured issues on ValidationError', () => {
    try {
      parseOrThrow(IntakeSchema, { ...valid, releaseState: 'ZZ' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const ve = err as ValidationError;
      expect(ve.statusCode).toBe(422);
      expect(ve.issues.length).toBeGreaterThan(0);
      expect(ve.issues[0].path).toContain('releaseState');
    }
  });
});

// ---------------------------------------------------------------------------
// BenefitsScreeningSchema
// ---------------------------------------------------------------------------

describe('BenefitsScreeningSchema', () => {
  const valid = {
    releaseState: 'CA',
    convictionType: 'misdemeanor',
    hasChildren: false,
    hasDisability: false,
    monthlyIncome: 0,
    householdSize: 1,
  };

  it('accepts a valid benefits screening payload', () => {
    const result = parseOrThrow(BenefitsScreeningSchema, valid);
    expect(result.releaseState).toBe('CA');
  });

  it('rejects negative income', () => {
    expect(() =>
      parseOrThrow(BenefitsScreeningSchema, { ...valid, monthlyIncome: -1 })
    ).toThrow(ValidationError);
  });

  it('rejects household size of 0', () => {
    expect(() =>
      parseOrThrow(BenefitsScreeningSchema, { ...valid, householdSize: 0 })
    ).toThrow(ValidationError);
  });

  it('rejects non-integer household size', () => {
    expect(() =>
      parseOrThrow(BenefitsScreeningSchema, { ...valid, householdSize: 1.5 })
    ).toThrow(ValidationError);
  });
});
