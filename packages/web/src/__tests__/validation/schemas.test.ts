/**
 * Unit tests for Reentry API boundary validation schemas.
 *
 * Run: npm test (turbo delegates to vitest)
 */

import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  ResourceQuerySchema,
  VoiceTranscriptSchema,
  parseOrThrow,
  ValidationError,
} from '../../lib/validation/schemas';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validIntake = {
  releaseDate: '2024-06-15',
  releaseState: 'GA',
  residenceState: 'GA',
  convictionTypes: ['nonviolent_drug'],
  supervisionStatus: 'parole',
  hasValidId: false,
  hasSocialSecurityCard: false,
  hasBirthCertificate: true,
  housingStatus: 'family_or_friend',
  employmentStatus: 'seeking_employment',
};

// ---------------------------------------------------------------------------
// IntakeSchema
// ---------------------------------------------------------------------------

describe('IntakeSchema', () => {
  it('accepts a fully valid intake payload', () => {
    const result = IntakeSchema.safeParse(validIntake);
    expect(result.success).toBe(true);
  });

  it('accepts optional fields when present', () => {
    const result = IntakeSchema.safeParse({
      ...validIntake,
      supervisionOfficerEmail: 'officer@dcs.ga.gov',
      preferredLanguage: 'es',
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid state code', () => {
    const result = IntakeSchema.safeParse({
      ...validIntake,
      releaseState: 'XX',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('releaseState');
    }
  });

  it('rejects a malformed release date', () => {
    const result = IntakeSchema.safeParse({
      ...validIntake,
      releaseDate: '06/15/2024', // MM/DD/YYYY — wrong format
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('releaseDate');
    }
  });

  it('rejects empty convictionTypes array', () => {
    const result = IntakeSchema.safeParse({
      ...validIntake,
      convictionTypes: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('convictionTypes');
    }
  });

  it('rejects an invalid supervisionOfficerEmail', () => {
    const result = IntakeSchema.safeParse({
      ...validIntake,
      supervisionOfficerEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('defaults preferredLanguage to "en" when omitted', () => {
    const result = IntakeSchema.safeParse(validIntake);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredLanguage).toBe('en');
    }
  });

  it('accepts FED as a valid state code for federal-only queries', () => {
    const result = IntakeSchema.safeParse({
      ...validIntake,
      releaseState: 'FED',
      residenceState: 'CA',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ResourceQuerySchema
// ---------------------------------------------------------------------------

describe('ResourceQuerySchema', () => {
  it('accepts a minimal valid query', () => {
    const result = ResourceQuerySchema.safeParse({
      state: 'TN',
      category: 'housing',
    });
    expect(result.success).toBe(true);
  });

  it('defaults limit to 20 and offset to 0', () => {
    const result = ResourceQuerySchema.safeParse({
      state: 'CA',
      category: 'legal_aid',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('rejects limit > 50', () => {
    const result = ResourceQuerySchema.safeParse({
      state: 'GA',
      category: 'employment',
      limit: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid category', () => {
    const result = ResourceQuerySchema.safeParse({
      state: 'GA',
      category: 'gambling', // not a valid category
    });
    expect(result.success).toBe(false);
  });

  it('rejects latitude out of range', () => {
    const result = ResourceQuerySchema.safeParse({
      state: 'GA',
      category: 'food',
      latitude: 200, // > 90
      longitude: -84.3,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// VoiceTranscriptSchema
// ---------------------------------------------------------------------------

describe('VoiceTranscriptSchema', () => {
  it('accepts a valid transcript payload', () => {
    const result = VoiceTranscriptSchema.safeParse({
      transcript: 'I was released from Macon State Prison on June 15th.',
      detectedLanguage: 'en',
      durationSeconds: 12.4,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty transcript', () => {
    const result = VoiceTranscriptSchema.safeParse({
      transcript: '',
      detectedLanguage: 'en',
      durationSeconds: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects audio longer than 10 minutes', () => {
    const result = VoiceTranscriptSchema.safeParse({
      transcript: 'Long audio...',
      detectedLanguage: 'en',
      durationSeconds: 601,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseOrThrow
// ---------------------------------------------------------------------------

describe('parseOrThrow', () => {
  it('returns typed data on success', () => {
    const data = parseOrThrow(IntakeSchema, validIntake);
    expect(data.releaseState).toBe('GA');
    expect(data.preferredLanguage).toBe('en');
  });

  it('throws ValidationError with statusCode 422 on failure', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { ...validIntake, releaseState: 'ZZ' })
    ).toThrow(ValidationError);

    try {
      parseOrThrow(IntakeSchema, { ...validIntake, releaseState: 'ZZ' });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      if (err instanceof ValidationError) {
        expect(err.statusCode).toBe(422);
        expect(err.issues.length).toBeGreaterThan(0);
        expect(err.issues[0].path).toContain('releaseState');
      }
    }
  });

  it('throws ValidationError with all field issues, not just the first', () => {
    try {
      parseOrThrow(IntakeSchema, {
        releaseDate: 'bad-date',
        releaseState: 'ZZ',
        // missing all other required fields
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        expect(err.issues.length).toBeGreaterThan(1);
      }
    }
  });
});
