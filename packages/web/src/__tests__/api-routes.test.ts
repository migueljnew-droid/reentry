import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==========================================
// API Route Tests — Integration-style tests
// that verify request handling, validation,
// and response format without real Supabase.
// ==========================================

// Mock modules before importing route handlers
vi.mock('@/lib/supabase-server', () => ({
  createServerClient: () => null,
  createServiceClient: () => null,
  createUserClient: () => null,
}));

vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  auditAction: (verb: string, resource: string) => `${verb}:${resource}`,
}));

vi.mock('@/lib/crypto', () => ({
  encryptField: (v: string) => `encrypted:${v}`,
  getEncryptionKey: () => Buffer.alloc(32),
}));

vi.mock('@/app/actions/generate-plan', () => ({
  generateReentryPlan: vi.fn().mockResolvedValue({
    id: 'plan-001',
    userName: 'Test',
    state: 'GA',
    stateName: 'Georgia',
    generatedAt: '2026-03-18T00:00:00Z',
    phases: [],
  }),
}));

function createMockRequest(
  body: unknown,
  options: {
    method?: string;
    searchParams?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = 'POST', searchParams = {}, headers = {} } = options;
  const url = new URL('http://localhost:3000/api/test');
  for (const [k, v] of Object.entries(searchParams)) {
    url.searchParams.set(k, v);
  }

  return new Request(url.toString(), {
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

// ==========================================
// /api/auth/signup
// ==========================================

describe('/api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns anonymous userId with valid name when no DB', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const req = createMockRequest({ fullName: 'John Doe' });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.userId).toBeDefined();
    expect(data.anonymous).toBe(true);
  });

  it('returns 422 for empty name', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const req = createMockRequest({ fullName: '' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe('Validation failed');
  });

  it('returns 422 for missing name', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const req = createMockRequest({});
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid JSON body', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const req = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: 'not json {{{',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON body');
  });

  it('accepts name with optional state and conviction type', async () => {
    const { POST } = await import('@/app/api/auth/signup/route');
    const req = createMockRequest({
      fullName: 'Jane Smith',
      stateOfRelease: 'CA',
      convictionType: 'nonviolent',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.userId).toBeDefined();
  });
});

// ==========================================
// /api/intake/start
// ==========================================

describe('/api/intake/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns sessionId and welcome message with default language', async () => {
    const { POST } = await import('@/app/api/intake/start/route');
    const req = createMockRequest({});
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessionId).toBeDefined();
    expect(data.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(data.reply).toContain('Welcome');
    expect(data.stage).toBe('welcome');
  });

  it('returns sessionId with Spanish language option', async () => {
    const { POST } = await import('@/app/api/intake/start/route');
    const req = createMockRequest({ language: 'es' });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessionId).toBeDefined();
  });

  it('returns 422 for invalid language', async () => {
    const { POST } = await import('@/app/api/intake/start/route');
    const req = createMockRequest({ language: 'fr' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });
});

// ==========================================
// /api/intake/message
// ==========================================

describe('/api/intake/message', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns reply with valid session and message', async () => {
    const { POST } = await import('@/app/api/intake/message/route');
    const req = createMockRequest({
      sessionId: validUUID,
      message: 'My name is John',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sessionId).toBe(validUUID);
    expect(data.reply).toContain('My name is John');
    expect(data.stage).toBe('processing');
  });

  it('returns 422 for missing sessionId', async () => {
    const { POST } = await import('@/app/api/intake/message/route');
    const req = createMockRequest({ message: 'Hello' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 422 for empty message', async () => {
    const { POST } = await import('@/app/api/intake/message/route');
    const req = createMockRequest({ sessionId: validUUID, message: '' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 422 for message exceeding 2000 chars', async () => {
    const { POST } = await import('@/app/api/intake/message/route');
    const req = createMockRequest({
      sessionId: validUUID,
      message: 'x'.repeat(2001),
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/intake/message/route');
    const req = new Request('http://localhost:3000/api/intake/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: '{invalid',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(400);
  });
});

// ==========================================
// /api/plans/generate
// ==========================================

describe('/api/plans/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns generated plan with valid input', async () => {
    const { POST } = await import('@/app/api/plans/generate/route');
    const req = createMockRequest({
      state: 'GA',
      convictionType: 'nonviolent',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.plan).toBeDefined();
    expect(data.plan.id).toBe('plan-001');
  });

  it('returns 422 for missing state', async () => {
    const { POST } = await import('@/app/api/plans/generate/route');
    const req = createMockRequest({ convictionType: 'nonviolent' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 422 for missing convictionType', async () => {
    const { POST } = await import('@/app/api/plans/generate/route');
    const req = createMockRequest({ state: 'GA' });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/plans/generate/route');
    const req = new Request('http://localhost:3000/api/plans/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: '{{not json',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(400);
  });

  it('accepts full input with all optional fields', async () => {
    const { POST } = await import('@/app/api/plans/generate/route');
    const req = createMockRequest({
      state: 'CA',
      stateName: 'California',
      convictionType: 'dui',
      releaseDate: '2026-01-15',
      immediateNeeds: ['housing', 'employment'],
      hasChildren: true,
      numberOfChildren: 2,
      hasSupportNetwork: true,
      workHistory: 'Construction',
      education: 'GED',
      supervisionType: 'parole',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(200);
  });
});

// ==========================================
// /api/plans/save
// ==========================================

describe('/api/plans/save', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns planId with saved=false when no DB', async () => {
    const { POST } = await import('@/app/api/plans/save/route');
    const req = createMockRequest({
      userId: validUUID,
      plan: {
        id: 'plan-001',
        state: 'GA',
        phases: [],
      },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.saved).toBe(false);
    expect(data.planId).toBe('plan-001');
  });

  it('returns 422 for invalid userId', async () => {
    const { POST } = await import('@/app/api/plans/save/route');
    const req = createMockRequest({
      userId: 'not-uuid',
      plan: { state: 'GA' },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 422 for missing plan', async () => {
    const { POST } = await import('@/app/api/plans/save/route');
    const req = createMockRequest({ userId: validUUID });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/plans/save/route');
    const req = new Request('http://localhost:3000/api/plans/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: '{{bad',
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);

    expect(res.status).toBe(400);
  });

  it('accepts plan with phases and steps', async () => {
    const { POST } = await import('@/app/api/plans/save/route');
    const req = createMockRequest({
      userId: validUUID,
      plan: {
        id: 'plan-002',
        state: 'CA',
        phases: [
          {
            id: 'immediate',
            steps: [
              {
                category: 'housing',
                title: 'Find shelter',
                instructions: ['Call local shelter'],
              },
            ],
          },
        ],
      },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.planId).toBe('plan-002');
  });
});
