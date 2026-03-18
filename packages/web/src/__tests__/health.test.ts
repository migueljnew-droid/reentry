import { describe, it, expect } from 'vitest';

/**
 * Tests for health check status determination logic.
 * We test the pure logic separately from the route handler
 * since the route depends on Supabase and env vars.
 */

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface ServiceStatus {
  supabase: boolean;
  openai: boolean;
}

// Extracted logic matching the route handler
function getOverallStatus(services: ServiceStatus): HealthStatus {
  if (!services.supabase) return 'unhealthy';
  if (!services.openai) return 'degraded';
  return 'healthy';
}

describe('health status determination', () => {
  it('returns "healthy" when all services are up', () => {
    expect(getOverallStatus({ supabase: true, openai: true })).toBe('healthy');
  });

  it('returns "degraded" when openai is down but supabase is up', () => {
    expect(getOverallStatus({ supabase: true, openai: false })).toBe('degraded');
  });

  it('returns "unhealthy" when supabase is down', () => {
    expect(getOverallStatus({ supabase: false, openai: true })).toBe('unhealthy');
  });

  it('returns "unhealthy" when all services are down (supabase is critical)', () => {
    expect(getOverallStatus({ supabase: false, openai: false })).toBe('unhealthy');
  });
});
