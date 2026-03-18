import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==========================================
// /api/consent — detailed tests
// Consent route uses createUserClient for auth.
// We test all validation paths and the no-auth path.
// ==========================================

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// Mock with authenticated user
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: () => null,
  createServiceClient: () => null,
  createUserClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

function createGetRequest(): Request {
  return new Request('http://localhost:3000/api/consent', {
    method: 'GET',
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
      Cookie: 'sb-access-token=test',
    },
  });
}

function createPostRequest(
  body: unknown,
  searchParams: Record<string, string> = {}
): Request & { nextUrl: URL } {
  const url = new URL('http://localhost:3000/api/consent');
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }
  const req = new Request(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
    },
    body: JSON.stringify(body),
  });
  // Add nextUrl for consent route
  return Object.assign(req, { nextUrl: url });
}

describe('/api/consent GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No auth') });

    const { GET } = await import('@/app/api/consent/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(401);
  });

  it('returns 404 when user profile not found', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123' } },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null, error: null }),
        }),
      }),
    });

    const { GET } = await import('@/app/api/consent/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(404);
  });

  it('returns consent state when user is found', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123' } },
      error: null,
    });

    // First call: users table lookup
    // Second call: user_consents table lookup
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({ data: { id: 'user-123' }, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            data: [
              { consent_type: 'data_processing', granted_at: '2026-03-01', revoked_at: null },
            ],
            error: null,
          }),
        }),
      };
    });

    const { GET } = await import('@/app/api/consent/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.consents).toBeDefined();
    expect(data.consents.data_processing.granted).toBe(true);
  });
});

describe('/api/consent POST — grant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('grants consent with valid type', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123' } },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({ data: { id: 'user-123' }, error: null }),
            }),
          }),
        };
      }
      return {
        upsert: () => ({ error: null }),
      };
    });

    const { POST } = await import('@/app/api/consent/route');
    const req = createPostRequest({ consentType: 'data_processing' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.consentType).toBe('data_processing');
    expect(data.granted).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No auth') });

    const { POST } = await import('@/app/api/consent/route');
    const req = createPostRequest({ consentType: 'data_processing' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(401);
  });
});

describe('/api/consent POST — revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revokes consent with action=revoke', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-123' } },
      error: null,
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              single: () => ({ data: { id: 'user-123' }, error: null }),
            }),
          }),
        };
      }
      return {
        update: () => ({
          eq: () => ({
            eq: () => ({ error: null }),
          }),
        }),
      };
    });

    const { POST } = await import('@/app/api/consent/route');
    const req = createPostRequest(
      { consentType: 'ai_recording' },
      { action: 'revoke' }
    );
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.consentType).toBe('ai_recording');
    expect(data.granted).toBe(false);
  });
});
