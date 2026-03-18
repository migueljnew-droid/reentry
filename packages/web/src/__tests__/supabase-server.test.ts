import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createServerClient,
  createServiceClient,
  createUserClient,
} from '@/lib/supabase-server';

// ==========================================
// Supabase client factory tests
// Verifies correct behavior with/without env vars
// ==========================================

describe('createServerClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns null when SUPABASE_URL is not set', () => {
    const client = createServerClient();
    expect(client).toBeNull();
  });

  it('returns null when both keys are missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const client = createServerClient();
    expect(client).toBeNull();
  });

  it('returns a client when URL and service key are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    const client = createServerClient();
    expect(client).not.toBeNull();
  });

  it('returns a client when URL and anon key are set (no service key)', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    const client = createServerClient();
    expect(client).not.toBeNull();
  });
});

describe('createServiceClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns null when URL is not set', () => {
    const client = createServiceClient();
    expect(client).toBeNull();
  });

  it('returns null when service key is not set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const client = createServiceClient();
    expect(client).toBeNull();
  });

  it('returns a client when both URL and service key are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    const client = createServiceClient();
    expect(client).not.toBeNull();
  });
});

describe('createUserClient', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const mockRequest = {
    cookies: {
      getAll: () => [],
    },
  } as unknown as import('next/server').NextRequest;

  it('returns null when URL is not set', () => {
    const client = createUserClient(mockRequest);
    expect(client).toBeNull();
  });

  it('returns null when anon key is not set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const client = createUserClient(mockRequest);
    expect(client).toBeNull();
  });

  it('returns a client when URL and anon key are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    const client = createUserClient(mockRequest);
    expect(client).not.toBeNull();
  });
});
