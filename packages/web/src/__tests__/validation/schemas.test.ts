import { describe, it, expect } from 'vitest';
import {
  IntakeSchema,
  BenefitsScreeningSchema,
  ContactSchema,
  ActionPlanRequestSchema,
  parseOrThrow,
} from '../../lib/validation/schemas';

// ── IntakeSchema ─────────────────────────────────────────────────────────────

describe('IntakeSchema', () => {
  const validBase = {
    releaseDate: '2025-01-15',
    state: 'GA',
    convictionType: 'felony',
    convictionCategories: ['drug_possession'],
    needsHousing: true,
    needsEmployment: true,
    needsIdReplacement: false,
    needsBenefits: true,
    needsLegalAid: false,
  };

  it('accepts a valid intake payload', () => {
    const result = IntakeSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid state abbreviation', () => {
    const result = IntakeSchema.safeParse({ ...validBase, state: 'XX' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed release date', () => {
    const result = IntakeSchema.safeParse({ ...validBase, releaseDate: '01/15/2025' });
    expect(result.success).toBe(false);
  });

  it('rejects a release date more than 1 year in the future', () => {
    const far = new Date();
    far.setFullYear(far.getFullYear() + 2);
    const result = IntakeSchema.safeParse({
      ...validBase,
      releaseDate: far.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it('accepts a release date exactly 1 year from today', () => {
    const edge = new Date();
    edge.setFullYear(edge.getFullYear() + 1);
    const result = IntakeSchema.safeParse({
      ...validBase,
      releaseDate: edge.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid phone number', () => {
    const result = IntakeSchema.safeParse({ ...validBase, phoneNumber: 'not-a-phone' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid E.164 phone number', () => {
    const result = IntakeSchema.safeParse({ ...validBase, phoneNumber: '+14045551234' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = IntakeSchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('defaults convictionType to unknown when omitted', () => {
    const { convictionType: _, ...withoutType } = validBase;
    const result = IntakeSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.convictionType).toBe('unknown');
    }
  });

  it('rejects more than 10 conviction categories', () => {
    const result = IntakeSchema.safeParse({
      ...validBase,
      convictionCategories: Array(11).fill('other'),
    });
    expect(result.success).toBe(false);
  });
});

// ── BenefitsScreeningSchema ──────────────────────────────────────────────────

describe('BenefitsScreeningSchema', () => {
  const validScreening = {
    state: 'CA',
    householdSize: 3,
    monthlyIncome: 1200,
    hasChildren: true,
    isPregnant: false,
    isVeteran: false,
    isDisabled: false,
    convictionCategories: [],
  };

  it('accepts a valid screening payload', () => {
    expect(BenefitsScreeningSchema.safeParse(validScreening).success).toBe(true);
  });

  it('rejects household size of 0', () => {
    expect(
      BenefitsScreeningSchema.safeParse({ ...validScreening, householdSize: 0 }).success
    ).toBe(false);
  });

  it('rejects negative monthly income', () => {
    expect(
      BenefitsScreeningSchema.safeParse({ ...validScreening, monthlyIncome: -1 }).success
    ).toBe(false);
  });

  it('rejects household size above 20', () => {
    expect(
      BenefitsScreeningSchema.safeParse({ ...validScreening, householdSize: 21 }).success
    ).toBe(false);
  });
});

// ── ContactSchema ────────────────────────────────────────────────────────────

describe('ContactSchema', () => {
  const validContact = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Need help with housing',
    message: 'I was released last week and need help finding shelter in Atlanta.',
    website: '',
  };

  it('accepts a valid contact payload', () => {
    expect(ContactSchema.safeParse(validContact).success).toBe(true);
  });

  it('rejects when honeypot field is filled (bot detection)', () => {
    expect(
      ContactSchema.safeParse({ ...validContact, website: 'http://spam.com' }).success
    ).toBe(false);
  });

  it('rejects a message shorter than 10 characters', () => {
    expect(
      ContactSchema.safeParse({ ...validContact, message: 'Hi' }).success
    ).toBe(false);
  });

  it('rejects a message longer than 5000 characters', () => {
    expect(
      ContactSchema.safeParse({ ...validContact, message: 'x'.repeat(5001) }).success
    ).toBe(false);
  });
});

// ── ActionPlanRequestSchema ──────────────────────────────────────────────────

describe('ActionPlanRequestSchema', () => {
  const validRequest = {
    intake: {
      releaseDate: '2025-03-01',
      state: 'TN',
      convictionType: 'misdemeanor',
      convictionCategories: [],
      needsHousing: false,
      needsEmployment: true,
      needsIdReplacement: true,
      needsBenefits: false,
      needsLegalAid: false,
    },
    language: 'en',
    voiceMode: false,
  };

  it('accepts a valid action plan request', () => {
    expect(ActionPlanRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('rejects an unsupported language', () => {
    expect(
      ActionPlanRequestSchema.safeParse({ ...validRequest, language: 'fr' }).success
    ).toBe(false);
  });

  it('defaults language to en when omitted', () => {
    const { language: _, ...withoutLang } = validRequest;
    const result = ActionPlanRequestSchema.safeParse(withoutLang);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.language).toBe('en');
  });
});

// ── parseOrThrow helper ──────────────────────────────────────────────────────

describe('parseOrThrow', () => {
  it('returns parsed data on success', () => {
    const data = parseOrThrow(ContactSchema, {
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Test',
      message: 'This is a valid message.',
      website: '',
    });
    expect(data.name).toBe('Jane');
  });

  it('throws with statusCode 422 and issues array on failure', () => {
    expect(() =>
      parseOrThrow(ContactSchema, { name: '', email: 'bad', subject: '', message: 'x' })
    ).toThrow('Validation failed');

    try {
      parseOrThrow(ContactSchema, { name: '', email: 'bad', subject: '', message: 'x' });
    } catch (err: unknown) {
      const e = err as { statusCode: number; issues: { path: string; message: string }[] };
      expect(e.statusCode).toBe(422);
      expect(Array.isArray(e.issues)).toBe(true);
      expect(e.issues.length).toBeGreaterThan(0);
    }
  });
});
