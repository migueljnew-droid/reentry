/**
 * Tests for packages/web/src/lib/validation/schemas.ts
 *
 * Location mandated by CLAUDE.md:
 *   packages/web/src/__tests__/validation/schemas.test.ts
 *
 * Run: npm test --workspace=packages/web
 */
import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  ResourceQuerySchema,
  ActionPlanRequestSchema,
  StateCodeSchema,
  ValidationError,
  parseOrThrow,
} from '../../lib/validation/schemas';

// ---------------------------------------------------------------------------
// StateCodeSchema
// ---------------------------------------------------------------------------
describe('StateCodeSchema', () => {
  it('accepts valid 2-letter state codes', () => {
    expect(parseOrThrow(StateCodeSchema, 'GA')).toBe('GA');
    expect(parseOrThrow(StateCodeSchema, 'CA')).toBe('CA');
    expect(parseOrThrow(StateCodeSchema, 'TN')).toBe('TN');
  });

  it('accepts FED for federal-only queries', () => {
    expect(parseOrThrow(StateCodeSchema, 'FED')).toBe('FED');
  });

  it('coerces lowercase to uppercase', () => {
    expect(parseOrThrow(StateCodeSchema, 'ga')).toBe('GA');
  });

  it('rejects invalid state codes', () => {
    expect(() => parseOrThrow(StateCodeSchema, 'XX')).toThrow(ValidationError);
    expect(() => parseOrThrow(StateCodeSchema, '')).toThrow(ValidationError);
    expect(() => parseOrThrow(StateCodeSchema, 'GEORGIA')).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// IntakeSchema
// ---------------------------------------------------------------------------
describe('IntakeSchema', () => {
  const validIntake = {
    releaseDate: '2024-06-15',
    releaseState: 'GA',
    convictionType: 'drug',
    supervisionStatus: 'parole',
    preferredChannel: 'web',
  };

  it('accepts a fully valid intake payload', () => {
    const result = parseOrThrow(IntakeSchema, validIntake);
    expect(result.releaseState).toBe('GA');
    expect(result.convictionType).toBe('drug');
  });

  it('defaults preferredChannel to web when omitted', () => {
    const { preferredChannel: _, ...withoutChannel } = validIntake;
    const result = parseOrThrow(IntakeSchema, withoutChannel);
    expect(result.preferredChannel).toBe('web');
  });

  it('rejects a malformed releaseDate', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...validIntake, releaseDate: '15-06-2024' })
    ).toThrow(ValidationError);
  });

  it('rejects an invalid calendar date', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...validIntake, releaseDate: '2024-13-99' })
    ).toThrow(ValidationError);
  });

  it('rejects an invalid releaseState', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...validIntake, releaseState: 'ZZ' })
    ).toThrow(ValidationError);
  });

  it('rejects an unknown convictionType', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...validIntake, convictionType: 'terrorism' })
    ).toThrow(ValidationError);
  });

  it('accepts optional fields when present', () => {
    const result = parseOrThrow(IntakeSchema, {
      ...validIntake,
      releaseCounty: 'Fulton',
      housingSituation: 'halfway_house',
      hasId: false,
    });
    expect(result.releaseCounty).toBe('Fulton');
    expect(result.housingSituation).toBe('halfway_house');
    expect(result.hasId).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(() => parseOrThrow(IntakeSchema, {})).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// ResourceQuerySchema
// ---------------------------------------------------------------------------
describe('ResourceQuerySchema', () => {
  const validQuery = {
    state: 'CA',
    categories: ['housing', 'food'],
  };

  it('accepts a valid resource query', () => {
    const result = parseOrThrow(ResourceQuerySchema, validQuery);
    expect(result.state).toBe('CA');
    expect(result.limit).toBe(20); // default
    expect(result.offset).toBe(0); // default
  });

  it('coerces string limit/offset to numbers', () => {
    const result = parseOrThrow(ResourceQuerySchema, {
      ...validQuery,
      limit: '50',
      offset: '10',
    });
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(10);
  });

  it('rejects limit > 100', () => {
    expect(() =>
      parseOrThrow(ResourceQuerySchema, { ...validQuery, limit: 101 })
    ).toThrow(ValidationError);
  });

  it('rejects empty categories array', () => {
    expect(() =>
      parseOrThrow(ResourceQuerySchema, { ...validQuery, categories: [] })
    ).toThrow(ValidationError);
  });

  it('rejects unknown category', () => {
    expect(() =>
      parseOrThrow(ResourceQuerySchema, { ...validQuery, categories: ['nightclub'] })
    ).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// ActionPlanRequestSchema
// ---------------------------------------------------------------------------
describe('ActionPlanRequestSchema', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  it('accepts a valid action plan request', () => {
    const result = parseOrThrow(ActionPlanRequestSchema, { intakeId: validUUID });
    expect(result.intakeId).toBe(validUUID);
    expect(result.modelHint).toBeUndefined();
  });

  it('accepts optional modelHint', () => {
    const result = parseOrThrow(ActionPlanRequestSchema, {
      intakeId: validUUID,
      modelHint: 'thorough',
    });
    expect(result.modelHint).toBe('thorough');
  });

  it('rejects a non-UUID intakeId', () => {
    expect(() =>
      parseOrThrow(ActionPlanRequestSchema, { intakeId: 'not-a-uuid' })
    ).toThrow(ValidationError);
  });

  it('rejects an unknown modelHint', () => {
    expect(() =>
      parseOrThrow(ActionPlanRequestSchema, { intakeId: validUUID, modelHint: 'ultra' })
    ).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// parseOrThrow — error shape
// ---------------------------------------------------------------------------
describe('parseOrThrow error shape', () => {
  it('throws ValidationError with statusCode 422', () => {
    try {
      parseOrThrow(IntakeSchema, {});
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).statusCode).toBe(422);
    }
  });

  it('includes structured issues array', () => {
    try {
      parseOrThrow(IntakeSchema, { releaseState: 'ZZ', convictionType: 'drug', supervisionStatus: 'none' });
      expect.fail('should have thrown');
    } catch (err) {
      const ve = err as ValidationError;
      expect(Array.isArray(ve.issues)).toBe(true);
      expect(ve.issues.length).toBeGreaterThan(0);
      const paths = ve.issues.map((i) => i.path.join('.'));
      // releaseDate is missing, releaseState is invalid
      expect(paths.some((p) => p.includes('releaseDate') || p.includes('releaseState'))).toBe(true);
    }
  });

  it('returns typed data on success', () => {
    const data = parseOrThrow(IntakeSchema, {
      releaseDate: '2025-01-01',
      releaseState: 'TN',
      convictionType: 'other',
      supervisionStatus: 'none',
    });
    // TypeScript type is Intake — runtime check
    expect(typeof data.releaseDate).toBe('string');
    expect(data.releaseState).toBe('TN');
  });
});
