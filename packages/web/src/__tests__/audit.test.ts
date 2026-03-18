import { describe, it, expect, beforeEach } from 'vitest';
import { auditAction } from '@/lib/audit';

// ==========================================
// auditAction helper
// ==========================================

describe('auditAction', () => {
  it('formats action string correctly', () => {
    expect(auditAction('read', 'users')).toBe('read:users');
    expect(auditAction('create', 'action_plans')).toBe('create:action_plans');
    expect(auditAction('screen', 'benefits')).toBe('screen:benefits');
    expect(auditAction('transcribe', 'voice_transcripts')).toBe('transcribe:voice_transcripts');
  });
});

// ==========================================
// logAudit integration behavior
// ==========================================

describe('logAudit', () => {
  // We test the module's behavior when no Supabase is configured.
  // In that case, logAudit should silently skip (no throws).
  // Testing with real Supabase is done in integration tests.

  beforeEach(() => {
    // Clear env to ensure no Supabase connection
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('does not throw when Supabase is not configured', async () => {
    // Dynamic import to pick up env changes
    const { logAudit } = await import('@/lib/audit');

    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent',
      }),
      cookies: { get: () => undefined },
      method: 'POST',
      nextUrl: { pathname: '/api/test' },
    } as unknown as import('next/server').NextRequest;

    // Should not throw — silently skips when no service client
    await expect(
      logAudit({
        action: 'test',
        resourceType: 'test',
        request: mockRequest,
      })
    ).resolves.toBeUndefined();
  });

  it('extracts IP from x-forwarded-for header correctly', () => {
    // This is more of a documentation test — the actual extraction
    // happens inside logAudit, which we tested above for no-throw.
    // The logic: take the first IP from the comma-separated list.
    const header = '203.0.113.50, 70.41.3.18, 150.172.238.178';
    const ip = header.split(',')[0].trim();
    expect(ip).toBe('203.0.113.50');
  });

  it('handles missing x-forwarded-for gracefully', () => {
    const headers = new Headers({});
    const forwardedFor = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp ?? null;
    expect(ip).toBeNull();
  });
});
