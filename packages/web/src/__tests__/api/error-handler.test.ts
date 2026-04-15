import { describe, it, expect, vi } from 'vitest';
import { withErrorHandler } from '@/lib/api/error-handler';
import { IntakeSchema, parseOrThrow } from '@/lib/validation/schemas';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('withErrorHandler', () => {
  it('passes through a successful response unchanged', async () => {
    const handler = withErrorHandler(async () =>
      Response.json({ ok: true }, { status: 200 })
    );
    const res = await handler(makeRequest({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 422 with structured issues for ValidationError', async () => {
    const handler = withErrorHandler(async (req) => {
      parseOrThrow(IntakeSchema, await req.json());
      return Response.json({ ok: true });
    });

    const res = await handler(
      makeRequest({ releaseDate: 'bad-date', releaseState: 'XX', primaryNeeds: [] })
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
    expect(body.statusCode).toBe(422);
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues.length).toBeGreaterThan(0);
    // Each issue must have path, message, code for UI field-level display
    for (const issue of body.issues) {
      expect(issue).toHaveProperty('path');
      expect(issue).toHaveProperty('message');
      expect(issue).toHaveProperty('code');
    }
  });

  it('returns 500 for unexpected errors without leaking internals', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = withErrorHandler(async () => {
      throw new Error('Database connection refused at 10.0.0.1:5432');
    });

    const res = await handler(makeRequest({}));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.statusCode).toBe(500);
    // Must NOT leak internal error message
    expect(body.error).not.toContain('10.0.0.1');
    expect(body.error).not.toContain('Database');

    consoleSpy.mockRestore();
  });

  it('does not expose ValidationError issues in a 500 response', async () => {
    const handler = withErrorHandler(async () => {
      // Manually throw a non-ValidationError to confirm branch separation
      throw new TypeError('Cannot read properties of undefined');
    });
    const res = await handler(makeRequest({}));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).not.toHaveProperty('issues');
  });
});
