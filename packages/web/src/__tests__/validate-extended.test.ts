import { describe, it, expect } from 'vitest';
import { validateRequest, parseJsonBody, formatZodError } from '@/lib/validate';
import { z } from 'zod';

// ==========================================
// validateRequest — detailed tests
// ==========================================

describe('validateRequest — detailed', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0).optional(),
  });

  it('returns parsed data on success', () => {
    const result = validateRequest(testSchema, { name: 'John', age: 30 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
      expect(result.data.age).toBe(30);
    }
  });

  it('returns 422 with validation details on failure', () => {
    const result = validateRequest(testSchema, { name: '', age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(422);
    }
  });

  it('returns 422 with field paths in details', async () => {
    const result = validateRequest(testSchema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
      expect(Array.isArray(body.details)).toBe(true);
    }
  });

  it('handles null input', () => {
    const result = validateRequest(testSchema, null);
    expect(result.success).toBe(false);
  });

  it('handles undefined input', () => {
    const result = validateRequest(testSchema, undefined);
    expect(result.success).toBe(false);
  });
});

// ==========================================
// parseJsonBody
// ==========================================

describe('parseJsonBody', () => {
  it('returns empty object for null', () => {
    expect(parseJsonBody(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(parseJsonBody(undefined)).toEqual({});
  });

  it('returns the body itself for objects', () => {
    const body = { name: 'test' };
    expect(parseJsonBody(body)).toBe(body);
  });

  it('returns the body for arrays', () => {
    const body = [1, 2, 3];
    expect(parseJsonBody(body)).toBe(body);
  });

  it('returns the body for strings', () => {
    expect(parseJsonBody('hello')).toBe('hello');
  });
});

// ==========================================
// formatZodError
// ==========================================

describe('formatZodError', () => {
  it('formats error messages with field paths', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name required'),
      age: z.number().int().min(0, 'Age must be positive'),
    });
    const result = schema.safeParse({ name: '', age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    }
  });

  it('handles deeply nested errors', () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1),
        }),
      }),
    });
    const result = schema.safeParse({ user: { profile: { name: '' } } });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toContain('user');
    }
  });
});
