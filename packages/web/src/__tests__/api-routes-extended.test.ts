import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('@/lib/supabase-server', () => ({
  createServerClient: () => null,
  createServiceClient: () => null,
  createUserClient: () => null,
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  auditAction: (verb: string, resource: string) => `${verb}:${resource}`,
}));

function createMockRequest(
  body: unknown,
  options: {
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = 'POST', headers = {} } = options;
  return new Request('http://localhost:3000/api/test', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function createGetRequest(): Request {
  return new Request('http://localhost:3000/api/test', {
    method: 'GET',
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'test-agent',
    },
  });
}

// ==========================================
// /api/health
// ==========================================

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy status when no DB configured (dev mode)', async () => {
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBeDefined();
    expect(data.service).toBe('reentry-web');
    expect(data.version).toBe('0.1.0');
    expect(data.timestamp).toBeDefined();
    expect(data.services).toBeDefined();
  });
});

// ==========================================
// /api/benefits/screen
// ==========================================

describe('/api/benefits/screen', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns benefits results with valid userId', async () => {
    const { POST } = await import('@/app/api/benefits/screen/route');
    const req = createMockRequest({ userId: validUUID });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.userId).toBe(validUUID);
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  });

  it('returns 422 for invalid userId', async () => {
    const { POST } = await import('@/app/api/benefits/screen/route');
    const req = createMockRequest({ userId: 'bad' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/benefits/screen/route');
    const req = new Request('http://localhost:3000/api/benefits/screen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: '{{bad',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(400);
  });

  it('includes SNAP and Medicaid in results', async () => {
    const { POST } = await import('@/app/api/benefits/screen/route');
    const req = createMockRequest({ userId: validUUID });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    const programs = data.results.map((r: { program: string }) => r.program);
    expect(programs).toContain('SNAP');
    expect(programs).toContain('Medicaid');
  });
});

// ==========================================
// /api/employment/match
// ==========================================

describe('/api/employment/match', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns employer matches with valid input', async () => {
    const { POST } = await import('@/app/api/employment/match/route');
    const req = createMockRequest({
      state: 'GA',
      convictionType: 'nonviolent',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toBeDefined();
    expect(Array.isArray(data.matches)).toBe(true);
    expect(data.totalEmployers).toBeGreaterThan(0);
  });

  it('accepts empty body (all optional)', async () => {
    const { POST } = await import('@/app/api/employment/match/route');
    const req = createMockRequest({});
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);
  });

  it('returns matches with match scores', async () => {
    const { POST } = await import('@/app/api/employment/match/route');
    const req = createMockRequest({
      state: 'GA',
      convictionType: 'nonviolent',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    for (const match of data.matches) {
      expect(typeof match.matchScore).toBe('number');
      expect(match.matchScore).toBeGreaterThan(0);
    }
  });

  it('flags restricted employers for sex offenses', async () => {
    const { POST } = await import('@/app/api/employment/match/route');
    const req = createMockRequest({
      convictionType: 'sex_offense',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    const restricted = data.matches.filter((m: { restricted: boolean }) => m.restricted);
    expect(restricted.length).toBeGreaterThan(0);
  });
});

// ==========================================
// /api/housing/search
// ==========================================

describe('/api/housing/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns housing options with valid input', async () => {
    const { POST } = await import('@/app/api/housing/search/route');
    const req = createMockRequest({
      state: 'GA',
      convictionType: 'nonviolent',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.housingOptions).toBeDefined();
    expect(Array.isArray(data.housingOptions)).toBe(true);
    expect(data.totalOptions).toBeGreaterThan(0);
  });

  it('accepts empty body (all optional)', async () => {
    const { POST } = await import('@/app/api/housing/search/route');
    const req = createMockRequest({});
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);
  });

  it('prioritizes immediate shelter when needsImmediate is true', async () => {
    const { POST } = await import('@/app/api/housing/search/route');
    const req = createMockRequest({
      needsImmediate: true,
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    // Rescue missions should be first when needsImmediate
    const firstTypes = data.housingOptions.slice(0, 3).map((h: { type: string }) => h.type);
    expect(firstTypes.some((t: string) => t.includes('Mission') || t.includes('Salvation'))).toBe(true);
  });
});

// ==========================================
// /api/deadlines
// ==========================================

describe('/api/deadlines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns deadline list', async () => {
    const { GET } = await import('@/app/api/deadlines/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.deadlines).toBeDefined();
    expect(Array.isArray(data.deadlines)).toBe(true);
    expect(data.deadlines.length).toBeGreaterThan(0);
  });

  it('returns deadlines with required fields', async () => {
    const { GET } = await import('@/app/api/deadlines/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    for (const deadline of data.deadlines) {
      expect(deadline.id).toBeDefined();
      expect(deadline.title).toBeDefined();
      expect(deadline.dueDate).toBeDefined();
      expect(deadline.category).toBeDefined();
    }
  });
});

// ==========================================
// /api/dashboard/analytics
// ==========================================

describe('/api/dashboard/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns analytics data', async () => {
    const { GET } = await import('@/app/api/dashboard/analytics/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.totalClients).toBeDefined();
    expect(data.activeClients).toBeDefined();
    expect(data.averageProgress).toBeDefined();
    expect(data.riskBreakdown).toBeDefined();
    expect(data.completionRate).toBeDefined();
  });

  it('returns risk breakdown with all levels', async () => {
    const { GET } = await import('@/app/api/dashboard/analytics/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(data.riskBreakdown.low).toBeDefined();
    expect(data.riskBreakdown.medium).toBeDefined();
    expect(data.riskBreakdown.high).toBeDefined();
    expect(data.riskBreakdown.critical).toBeDefined();
  });
});

// ==========================================
// /api/plans/[id]/steps/[stepId] (PATCH)
// ==========================================

describe('/api/plans/[id]/steps/[stepId]', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns step update with saved=false when no DB', async () => {
    const { PATCH } = await import('@/app/api/plans/[id]/steps/[stepId]/route');
    const req = createMockRequest({ status: 'completed' });
    const res = await PATCH(
      req as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ id: validUUID, stepId: validUUID }) }
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stepId).toBe(validUUID);
    expect(data.status).toBe('completed');
    expect(data.saved).toBe(false);
  });

  it('returns 422 for invalid stepId', async () => {
    const { PATCH } = await import('@/app/api/plans/[id]/steps/[stepId]/route');
    const req = createMockRequest({ status: 'completed' });
    const res = await PATCH(
      req as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ id: validUUID, stepId: 'not-uuid' }) }
    );

    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid status value', async () => {
    const { PATCH } = await import('@/app/api/plans/[id]/steps/[stepId]/route');
    const req = createMockRequest({ status: 'invalid' });
    const res = await PATCH(
      req as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ id: validUUID, stepId: validUUID }) }
    );

    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid JSON', async () => {
    const { PATCH } = await import('@/app/api/plans/[id]/steps/[stepId]/route');
    const req = new Request('http://localhost:3000/api/test', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: '{{invalid',
    });
    const res = await PATCH(
      req as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ id: validUUID, stepId: validUUID }) }
    );

    expect(res.status).toBe(400);
  });
});

// ==========================================
// /api/plans/[id] (GET)
// ==========================================

describe('/api/plans/[id]', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when no DB configured', async () => {
    const { GET } = await import('@/app/api/plans/[id]/route');
    const req = createGetRequest();
    const res = await GET(
      req as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ id: validUUID }) }
    );

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('Database not configured');
  });

  it('returns 422 for invalid plan ID', async () => {
    const { GET } = await import('@/app/api/plans/[id]/route');
    const req = createGetRequest();
    const res = await GET(
      req as unknown as import('next/server').NextRequest,
      { params: Promise.resolve({ id: 'not-uuid' }) }
    );

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe('Invalid plan ID');
  });
});

// ==========================================
// /api/consent (requires auth — test validation only)
// ==========================================

describe('/api/consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 503 when DB not configured', async () => {
    const { GET } = await import('@/app/api/consent/route');
    const req = createGetRequest();
    const res = await GET(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('Database not configured');
  });

  it('POST returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/consent/route');
    const req = new Request('http://localhost:3000/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: '{{bad',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(400);
  });

  it('POST returns 422 for invalid consent type', async () => {
    const { POST } = await import('@/app/api/consent/route');
    const baseReq = createMockRequest({ consentType: 'marketing' });
    // consent route accesses req.nextUrl.searchParams
    const req = Object.assign(baseReq, {
      nextUrl: new URL('http://localhost:3000/api/consent'),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });
});
