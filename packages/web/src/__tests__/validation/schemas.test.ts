import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  BenefitsScreeningSchema,
  EmploymentSearchSchema,
  DeadlineSchema,
  ValidationError,
  parseOrThrow,
} from '@/lib/validation/schemas';

// ─── parseOrThrow helper ───────────────────────────────────────────────────────
describe('parseOrThrow', () => {
  it('returns typed data on valid input', () => {
    const result = parseOrThrow(IntakeSchema, {
      releaseDate: '2024-01-15',
      releaseState: 'GA',
      convictionType: 'felony',
      supervisionStatus: 'parole',
      primaryNeeds: ['housing', 'id_documents'],
    });
    expect(result.releaseState).toBe('GA');
    expect(result.convictionType).toBe('felony');
  });

  it('throws ValidationError on invalid input', () => {
    expect(() =>
      parseOrThrow(IntakeSchema, { releaseDate: 'not-a-date', releaseState: 'XX', primaryNeeds: [] })
    ).toThrow(ValidationError);
  });

  it('ValidationError has statusCode 422', () => {
    try {
      parseOrThrow(IntakeSchema, {});
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).statusCode).toBe(422);
      expect((err as ValidationError).issues.length).toBeGreaterThan(0);
    }
  });
});

// ─── IntakeSchema ──────────────────────────────────────────────────────────────
describe('IntakeSchema', () => {
  const validBase = {
    releaseDate: '2024-03-01',
    releaseState: 'GA',
    primaryNeeds: ['housing'],
  };

  it('accepts a minimal valid intake', () => {
    const result = IntakeSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('applies default convictionType of unknown', () => {
    const result = IntakeSchema.safeParse(validBase);
    expect(result.success && result.data.convictionType).toBe('unknown');
  });

  it('normalises state code to uppercase', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseState: 'ga' });
    expect(result.success && result.data.releaseState).toBe('GA');
  });

  it('rejects a future release date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = IntakeSchema.safeParse({
      ...validBase,
      releaseDate: future.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid date string', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseDate: '2024-13-45' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid state code', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseState: 'XX' });
    expect(result.success).toBe(false);
  });

  it('accepts FED as a valid state code', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseState: 'FED' });
    expect(result.success).toBe(true);
  });

  it('rejects empty primaryNeeds array', () => {
    const result = IntakeSchema.safeParse({ ...validBase, primaryNeeds: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 10 primaryNeeds', () => {
    const result = IntakeSchema.safeParse({
      ...validBase,
      primaryNeeds: [
        'id_documents','housing','employment','benefits','healthcare',
        'legal_aid','substance_treatment','mental_health','family_reunification',
        'education','education', // 11 items
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 50 state codes plus DC and FED', () => {
    const states = [
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
      'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
      'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
      'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
      'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
      'DC','FED',
    ];
    for (const state of states) {
      const result = IntakeSchema.safeParse({ ...validBase, releaseState: state });
      expect(result.success, `Expected ${state} to be valid`).toBe(true);
    }
  });
});

// ─── BenefitsScreeningSchema ───────────────────────────────────────────────────
describe('BenefitsScreeningSchema', () => {
  const validBase = {
    state: 'GA',
    householdSize: 2,
    monthlyIncome: 800,
  };

  it('accepts valid benefits screening data', () => {
    const result = BenefitsScreeningSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('defaults hasChildren, isVeteran, hasDisability to false', () => {
    const result = BenefitsScreeningSchema.safeParse(validBase);
    if (result.success) {
      expect(result.data.hasChildren).toBe(false);
      expect(result.data.isVeteran).toBe(false);
      expect(result.data.hasDisability).toBe(false);
    }
  });

  it('rejects negative income', () => {
    const result = BenefitsScreeningSchema.safeParse({ ...validBase, monthlyIncome: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects household size of 0', () => {
    const result = BenefitsScreeningSchema.safeParse({ ...validBase, householdSize: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects fractional household size', () => {
    const result = BenefitsScreeningSchema.safeParse({ ...validBase, householdSize: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid state code', () => {
    const result = BenefitsScreeningSchema.safeParse({ ...validBase, state: 'ZZ' });
    expect(result.success).toBe(false);
  });
});

// ─── EmploymentSearchSchema ────────────────────────────────────────────────────
describe('EmploymentSearchSchema', () => {
  const validBase = { state: 'TN' };

  it('accepts minimal valid employment search', () => {
    const result = EmploymentSearchSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts valid ZIP code', () => {
    const result = EmploymentSearchSchema.safeParse({ ...validBase, zipCode: '30301' });
    expect(result.success).toBe(true);
  });

  it('accepts ZIP+4 format', () => {
    const result = EmploymentSearchSchema.safeParse({ ...validBase, zipCode: '30301-1234' });
    expect(result.success).toBe(true);
  });

  it('rejects malformed ZIP code', () => {
    const result = EmploymentSearchSchema.safeParse({ ...validBase, zipCode: 'ABCDE' });
    expect(result.success).toBe(false);
  });

  it('defaults skills to empty array', () => {
    const result = EmploymentSearchSchema.safeParse(validBase);
    expect(result.success && result.data.skills).toEqual([]);
  });
});

// ─── DeadlineSchema ────────────────────────────────────────────────────────────
describe('DeadlineSchema', () => {
  const validBase = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    deadlineType: 'parole_checkin',
    dueDate: '2025-06-15',
    title: 'Monthly parole check-in',
  };

  it('accepts a valid deadline', () => {
    const result = DeadlineSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for userId', () => {
    const result = DeadlineSchema.safeParse({ ...validBase, userId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid deadline type', () => {
    const result = DeadlineSchema.safeParse({ ...validBase, deadlineType: 'random_thing' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = DeadlineSchema.safeParse({ ...validBase, title: '' });
    expect(result.success).toBe(false);
  });

  it('defaults reminderDaysBefore to 1', () => {
    const result = DeadlineSchema.safeParse(validBase);
    expect(result.success && result.data.reminderDaysBefore).toBe(1);
  });

  it('rejects reminderDaysBefore greater than 30', () => {
    const result = DeadlineSchema.safeParse({ ...validBase, reminderDaysBefore: 31 });
    expect(result.success).toBe(false);
  });
});
