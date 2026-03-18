import { describe, it, expect } from 'vitest';
import { validateRequest } from '@/lib/validate';
import {
  intakeStartSchema,
  intakeMessageSchema,
  planGenerateSchema,
  planSaveSchema,
  planIdSchema,
  stepUpdateSchema,
  signupSchema,
  benefitsScreenSchema,
  employmentMatchSchema,
  housingSearchSchema,
  consentGrantSchema,
  consentRevokeSchema,
} from '@/lib/schemas';

// ==========================================
// validateRequest utility
// ==========================================

describe('validateRequest', () => {
  it('returns success with valid data', () => {
    const result = validateRequest(intakeStartSchema, { language: 'en' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('en');
    }
  });

  it('returns failure response with invalid data', () => {
    const result = validateRequest(intakeMessageSchema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(422);
    }
  });
});

// ==========================================
// intakeStartSchema
// ==========================================

describe('intakeStartSchema', () => {
  it('accepts empty object (defaults to en)', () => {
    const result = intakeStartSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language).toBe('en');
    }
  });

  it('accepts language=es', () => {
    const result = intakeStartSchema.safeParse({ language: 'es' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid language', () => {
    const result = intakeStartSchema.safeParse({ language: 'fr' });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// intakeMessageSchema
// ==========================================

describe('intakeMessageSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid sessionId + message', () => {
    const result = intakeMessageSchema.safeParse({
      sessionId: validUUID,
      message: 'Hello',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing sessionId', () => {
    const result = intakeMessageSchema.safeParse({ message: 'Hello' });
    expect(result.success).toBe(false);
  });

  it('rejects empty message', () => {
    const result = intakeMessageSchema.safeParse({
      sessionId: validUUID,
      message: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message over 2000 chars', () => {
    const result = intakeMessageSchema.safeParse({
      sessionId: validUUID,
      message: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID sessionId', () => {
    const result = intakeMessageSchema.safeParse({
      sessionId: 'not-a-uuid',
      message: 'Hello',
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// planGenerateSchema
// ==========================================

describe('planGenerateSchema', () => {
  it('accepts minimal valid input', () => {
    const result = planGenerateSchema.safeParse({
      state: 'GA',
      convictionType: 'nonviolent',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe('GA');
      expect(result.data.immediateNeeds).toEqual([]);
      expect(result.data.hasChildren).toBe(false);
    }
  });

  it('rejects missing state', () => {
    const result = planGenerateSchema.safeParse({
      convictionType: 'nonviolent',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing convictionType', () => {
    const result = planGenerateSchema.safeParse({ state: 'GA' });
    expect(result.success).toBe(false);
  });

  it('rejects state with wrong length', () => {
    const result = planGenerateSchema.safeParse({
      state: 'Georgia',
      convictionType: 'nonviolent',
    });
    expect(result.success).toBe(false);
  });

  it('accepts full input with all optional fields', () => {
    const result = planGenerateSchema.safeParse({
      state: 'CA',
      stateName: 'California',
      convictionType: 'dui',
      releaseDate: '2026-01-15',
      immediateNeeds: ['housing', 'employment'],
      hasChildren: true,
      numberOfChildren: 2,
      hasSupportNetwork: true,
      workHistory: 'Construction',
      education: 'GED',
      supervisionType: 'parole',
    });
    expect(result.success).toBe(true);
  });
});

// ==========================================
// planSaveSchema
// ==========================================

describe('planSaveSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid plan save input', () => {
    const result = planSaveSchema.safeParse({
      userId: validUUID,
      plan: {
        state: 'GA',
        phases: [],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID userId', () => {
    const result = planSaveSchema.safeParse({
      userId: 'bad',
      plan: { state: 'GA' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing plan', () => {
    const result = planSaveSchema.safeParse({ userId: validUUID });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// planIdSchema
// ==========================================

describe('planIdSchema', () => {
  it('accepts valid UUID', () => {
    const result = planIdSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID', () => {
    const result = planIdSchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// stepUpdateSchema
// ==========================================

describe('stepUpdateSchema', () => {
  it('accepts valid statuses', () => {
    for (const status of ['pending', 'in_progress', 'completed', 'skipped']) {
      const result = stepUpdateSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = stepUpdateSchema.safeParse({ status: 'done' });
    expect(result.success).toBe(false);
  });

  it('rejects missing status', () => {
    const result = stepUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ==========================================
// signupSchema
// ==========================================

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse({
      fullName: 'John Doe',
      stateOfRelease: 'GA',
      convictionType: 'nonviolent',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal signup (name only)', () => {
    const result = signupSchema.safeParse({ fullName: 'Jane' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = signupSchema.safeParse({ fullName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = signupSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ==========================================
// benefitsScreenSchema
// ==========================================

describe('benefitsScreenSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid benefits screen input', () => {
    const result = benefitsScreenSchema.safeParse({
      userId: validUUID,
      state: 'GA',
      income: 25000,
      dependents: 2,
    });
    expect(result.success).toBe(true);
  });

  it('accepts userId only', () => {
    const result = benefitsScreenSchema.safeParse({ userId: validUUID });
    expect(result.success).toBe(true);
  });

  it('rejects negative income', () => {
    const result = benefitsScreenSchema.safeParse({
      userId: validUUID,
      income: -1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID userId', () => {
    const result = benefitsScreenSchema.safeParse({ userId: 'bad' });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// employmentMatchSchema
// ==========================================

describe('employmentMatchSchema', () => {
  it('accepts valid employment match input', () => {
    const result = employmentMatchSchema.safeParse({
      state: 'CA',
      convictionType: 'nonviolent',
      skills: ['welding', 'cdl'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    const result = employmentMatchSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects too many skills', () => {
    const result = employmentMatchSchema.safeParse({
      skills: Array.from({ length: 51 }, (_, i) => `skill-${i}`),
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// housingSearchSchema
// ==========================================

describe('housingSearchSchema', () => {
  it('accepts valid housing search input', () => {
    const result = housingSearchSchema.safeParse({
      state: 'GA',
      convictionType: 'nonviolent',
      needsImmediate: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    const result = housingSearchSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('defaults needsImmediate to false', () => {
    const result = housingSearchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.needsImmediate).toBe(false);
    }
  });
});

// ==========================================
// consentGrantSchema
// ==========================================

describe('consentGrantSchema', () => {
  it('accepts data_processing', () => {
    const result = consentGrantSchema.safeParse({ consentType: 'data_processing' });
    expect(result.success).toBe(true);
  });

  it('accepts ai_recording', () => {
    const result = consentGrantSchema.safeParse({ consentType: 'ai_recording' });
    expect(result.success).toBe(true);
  });

  it('accepts third_party_sharing', () => {
    const result = consentGrantSchema.safeParse({ consentType: 'third_party_sharing' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid consent type', () => {
    const result = consentGrantSchema.safeParse({ consentType: 'marketing' });
    expect(result.success).toBe(false);
  });

  it('rejects missing consentType', () => {
    const result = consentGrantSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ==========================================
// consentRevokeSchema
// ==========================================

describe('consentRevokeSchema', () => {
  it('accepts valid consent types for revocation', () => {
    for (const type of ['data_processing', 'ai_recording', 'third_party_sharing']) {
      const result = consentRevokeSchema.safeParse({ consentType: type });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid consent type', () => {
    const result = consentRevokeSchema.safeParse({ consentType: 'invalid' });
    expect(result.success).toBe(false);
  });
});
