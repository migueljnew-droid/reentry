import { describe, it, expect } from 'vitest';
import {
  deadlineCreateSchema,
  planSaveSchema,
  planGenerateSchema,
  signupSchema,
  benefitsScreenSchema,
} from '@/lib/schemas';

// ==========================================
// Extended schema edge-case tests
// ==========================================

describe('deadlineCreateSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid deadline', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      title: 'Parole check-in',
      dueDate: '2026-04-01T10:00:00Z',
      category: 'parole',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      dueDate: '2026-04-01T10:00:00Z',
      category: 'parole',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      title: '',
      dueDate: '2026-04-01T10:00:00Z',
      category: 'parole',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      title: 'Test',
      dueDate: '2026-04-01T10:00:00Z',
      category: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid categories', () => {
    const categories = [
      'parole', 'court', 'benefits', 'employment',
      'housing', 'id', 'legal', 'supervision',
    ];
    for (const category of categories) {
      const result = deadlineCreateSchema.safeParse({
        userId: validUUID,
        title: 'Test',
        dueDate: '2026-04-01T10:00:00Z',
        category,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects non-datetime dueDate', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      title: 'Test',
      dueDate: '2026-04-01',
      category: 'parole',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional description', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      title: 'Check-in',
      description: 'Bring ID and proof of address',
      dueDate: '2026-04-01T10:00:00Z',
      category: 'supervision',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional planStepId', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      title: 'Test',
      dueDate: '2026-04-01T10:00:00Z',
      category: 'parole',
      planStepId: validUUID,
    });
    expect(result.success).toBe(true);
  });

  it('rejects title over 300 chars', () => {
    const result = deadlineCreateSchema.safeParse({
      userId: validUUID,
      title: 'x'.repeat(301),
      dueDate: '2026-04-01T10:00:00Z',
      category: 'parole',
    });
    expect(result.success).toBe(false);
  });
});

describe('planSaveSchema — edge cases', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts plan with detailed steps', () => {
    const result = planSaveSchema.safeParse({
      userId: validUUID,
      plan: {
        id: 'plan-abc',
        state: 'TN',
        phases: [{
          id: 'immediate',
          steps: [{
            id: 'step-1',
            category: 'housing',
            title: 'Find shelter',
            description: 'Find emergency shelter in Nashville',
            instructions: ['Call 211', 'Visit rescue mission'],
            documentsNeeded: ['Release papers'],
            deadline: 'Today',
            priority: 1,
          }],
        }],
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects step title over 500 chars', () => {
    const result = planSaveSchema.safeParse({
      userId: validUUID,
      plan: {
        state: 'GA',
        phases: [{
          id: 'test',
          steps: [{
            category: 'housing',
            title: 'x'.repeat(501),
          }],
        }],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('planGenerateSchema — edge cases', () => {
  it('uppercases state code', () => {
    const result = planGenerateSchema.safeParse({
      state: 'ga',
      convictionType: 'nonviolent',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe('GA');
    }
  });

  it('rejects too many immediate needs (max 20)', () => {
    const result = planGenerateSchema.safeParse({
      state: 'GA',
      convictionType: 'nonviolent',
      immediateNeeds: Array.from({ length: 21 }, (_, i) => `need-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('rejects numberOfChildren over 20', () => {
    const result = planGenerateSchema.safeParse({
      state: 'GA',
      convictionType: 'nonviolent',
      numberOfChildren: 21,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative numberOfChildren', () => {
    const result = planGenerateSchema.safeParse({
      state: 'GA',
      convictionType: 'nonviolent',
      numberOfChildren: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('signupSchema — edge cases', () => {
  it('trims whitespace from name', () => {
    const result = signupSchema.safeParse({ fullName: '  John Doe  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('John Doe');
    }
  });

  it('rejects name over 200 chars', () => {
    const result = signupSchema.safeParse({ fullName: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('benefitsScreenSchema — edge cases', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('rejects dependents over 20', () => {
    const result = benefitsScreenSchema.safeParse({
      userId: validUUID,
      dependents: 21,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer dependents', () => {
    const result = benefitsScreenSchema.safeParse({
      userId: validUUID,
      dependents: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero income', () => {
    const result = benefitsScreenSchema.safeParse({
      userId: validUUID,
      income: 0,
    });
    expect(result.success).toBe(true);
  });
});
