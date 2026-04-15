import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  ResourceQuerySchema,
  ActionPlanRequestSchema,
  parseOrThrow,
  ValidationError,
} from '../../lib/validation/schemas';

// ---------------------------------------------------------------------------
// IntakeSchema
// ---------------------------------------------------------------------------
describe('IntakeSchema', () => {
  const valid = {
    releaseDate: '2025-09-01',
    state: 'GA',
    convictionType: 'nonviolent_drug',
    needs: ['housing', 'benefits'],
    zipCode: '30303',
  };

  it('accepts a fully valid intake payload', () => {
    expect(() => parseOrThrow(IntakeSchema, valid)).not.toThrow();
  });

  it('accepts lowercase state and coerces to uppercase', () => {
    const result = parseOrThrow(IntakeSchema, { ...valid, state: 'ga' });
    expect(result.state).toBe('GA');
  });

  it('rejects an invalid state code', () => {
    expect(() => parseOrThrow(IntakeSchema, { ...valid, state: 'XX' })).toThrow(
      ValidationError,
    );
  });

  it('rejects a malformed release date', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...valid, releaseDate: '09/01/2025' }),
    ).toThrow(ValidationError);
  });

  it('rejects an empty needs array', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...valid, needs: [] }),
    ).toThrow(ValidationError);
  });

  it('rejects an invalid conviction type', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...valid, convictionType: 'murder' }),
    ).toThrow(ValidationError);
  });

  it('rejects a malformed ZIP code', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...valid, zipCode: '3030' }),
    ).toThrow(ValidationError);
  });

  it('accepts a ZIP+4 format', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...valid, zipCode: '30303-1234' }),
    ).not.toThrow();
  });

  it('accepts payload without optional fields', () => {
    const { zipCode, voiceTranscript, ...minimal } = { ...valid, voiceTranscript: undefined };
    expect(() => parseOrThrow(IntakeSchema, minimal)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ResourceQuerySchema
// ---------------------------------------------------------------------------
describe('ResourceQuerySchema', () => {
  const valid = {
    state: 'CA',
    need: 'employment',
  };

  it('accepts a minimal valid resource query', () => {
    expect(() => parseOrThrow(ResourceQuerySchema, valid)).not.toThrow();
  });

  it('defaults limit to 20 when omitted', () => {
    const result = parseOrThrow(ResourceQuerySchema, valid);
    expect(result.limit).toBe(20);
  });

  it('coerces string limit to number', () => {
    const result = parseOrThrow(ResourceQuerySchema, { ...valid, limit: '50' });
    expect(result.limit).toBe(50);
  });

  it('rejects limit above 100', () => {
    expect(() =>
      parseOrThrow(ResourceQuerySchema, { ...valid, limit: 101 }),
    ).toThrow(ValidationError);
  });

  it('rejects an unknown need type', () => {
    expect(() =>
      parseOrThrow(ResourceQuerySchema, { ...valid, need: 'food' }),
    ).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// ActionPlanRequestSchema
// ---------------------------------------------------------------------------
describe('ActionPlanRequestSchema', () => {
  const valid = {
    releaseDate: '2025-10-15',
    state: 'TN',
    convictionType: 'dui',
    needs: ['id_replacement', 'employment'],
  };

  it('accepts a valid action plan request without resume token', () => {
    expect(() => parseOrThrow(ActionPlanRequestSchema, valid)).not.toThrow();
  });

  it('accepts a valid UUID resume token', () => {
    expect(() =>
      parseOrThrow(ActionPlanRequestSchema, {
        ...valid,
        resumeToken: '550e8400-e29b-41d4-a716-446655440000',
      }),
    ).not.toThrow();
  });

  it('rejects a non-UUID resume token', () => {
    expect(() =>
      parseOrThrow(ActionPlanRequestSchema, {
        ...valid,
        resumeToken: 'not-a-uuid',
      }),
    ).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// parseOrThrow error shape
// ---------------------------------------------------------------------------
describe('parseOrThrow', () => {
  it('throws ValidationError with statusCode 422', () => {
    try {
      parseOrThrow(IntakeSchema, {});
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).statusCode).toBe(422);
    }
  });

  it('exposes structured issues array', () => {
    try {
      parseOrThrow(IntakeSchema, { state: 'XX', needs: [] });
      expect.fail('should have thrown');
    } catch (err) {
      const ve = err as ValidationError;
      expect(Array.isArray(ve.issues)).toBe(true);
      expect(ve.issues.length).toBeGreaterThan(0);
      expect(ve.issues[0]).toHaveProperty('path');
      expect(ve.issues[0]).toHaveProperty('message');
    }
  });
});
