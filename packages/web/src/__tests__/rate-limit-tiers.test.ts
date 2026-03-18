import { describe, it, expect } from 'vitest';
import { getTier, checkRateLimit } from '@/lib/rate-limit';

// ==========================================
// Rate limit tier classification tests
// ==========================================

describe('getTier', () => {
  it('classifies intake routes as "ai"', () => {
    expect(getTier('/api/intake/start')).toBe('ai');
    expect(getTier('/api/intake/message')).toBe('ai');
    expect(getTier('/api/intake/voice')).toBe('ai');
  });

  it('classifies plan generation as "ai"', () => {
    expect(getTier('/api/plans/generate')).toBe('ai');
  });

  it('classifies auth routes as "auth"', () => {
    expect(getTier('/api/auth/signup')).toBe('auth');
    expect(getTier('/api/auth/login')).toBe('auth');
  });

  it('classifies other API routes as "general"', () => {
    expect(getTier('/api/health')).toBe('general');
    expect(getTier('/api/plans/save')).toBe('general');
    expect(getTier('/api/benefits/screen')).toBe('general');
    expect(getTier('/api/employment/match')).toBe('general');
    expect(getTier('/api/housing/search')).toBe('general');
    expect(getTier('/api/deadlines')).toBe('general');
    expect(getTier('/api/consent')).toBe('general');
    expect(getTier('/api/dashboard/analytics')).toBe('general');
  });

  it('classifies non-API paths as "general"', () => {
    expect(getTier('/some/other/path')).toBe('general');
  });
});

// ==========================================
// checkRateLimit — no Redis configured
// ==========================================

describe('checkRateLimit (no Redis)', () => {
  it('returns null when Upstash is not configured', async () => {
    // No UPSTASH_REDIS_REST_URL set
    const result = await checkRateLimit('test-user', 'general');
    expect(result).toBeNull();
  });

  it('returns null for all tiers when not configured', async () => {
    for (const tier of ['ai', 'auth', 'general'] as const) {
      const result = await checkRateLimit('test-user', tier);
      expect(result).toBeNull();
    }
  });
});
