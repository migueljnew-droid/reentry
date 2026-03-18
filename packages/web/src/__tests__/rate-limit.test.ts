import { describe, it, expect } from 'vitest';
import { getTier } from '@/lib/rate-limit';

// ==========================================
// Tier classification
// ==========================================

describe('getTier', () => {
  it('classifies /api/intake/* as AI tier', () => {
    expect(getTier('/api/intake/start')).toBe('ai');
    expect(getTier('/api/intake/voice')).toBe('ai');
    expect(getTier('/api/intake/message')).toBe('ai');
  });

  it('classifies /api/plans/generate as AI tier', () => {
    expect(getTier('/api/plans/generate')).toBe('ai');
  });

  it('classifies /api/auth/* as auth tier', () => {
    expect(getTier('/api/auth/signup')).toBe('auth');
    expect(getTier('/api/auth/callback')).toBe('auth');
    expect(getTier('/api/auth/login')).toBe('auth');
  });

  it('classifies other API routes as general tier', () => {
    expect(getTier('/api/health')).toBe('general');
    expect(getTier('/api/benefits/search')).toBe('general');
    expect(getTier('/api/employment/match')).toBe('general');
    expect(getTier('/api/plans/save')).toBe('general');
    expect(getTier('/api/dashboard/stats')).toBe('general');
  });

  it('does not classify /api/plans/generate/something as AI tier', () => {
    // /api/plans/generate is exact match; sub-paths are general
    expect(getTier('/api/plans/generate/something')).toBe('general');
  });

  it('classifies /api/intake sub-paths as AI tier', () => {
    expect(getTier('/api/intake/voice/something')).toBe('ai');
  });
});
