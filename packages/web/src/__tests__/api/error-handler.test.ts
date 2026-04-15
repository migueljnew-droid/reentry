import { describe, it, expect } from 'vitest';
import { withErrorHandler } from '../../lib/api/error-handler';
import { ValidationError } from '../../lib/validation/schemas';

// Minimal Request factory for App Router handler tests
function makeRequest(body: unknown = {}): Request {
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
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 422 with structured issues for ValidationError', async () => {
    const issues = [
      { path: ['releaseState'], message: 'Invalid state', code: 'invalid_string' },
    ];
    const handler = withErrorHandler(async () => {
      throw new ValidationError(issues);
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
    expect(body.statusCode).toBe(422);
    expect(body.issues).toEqual(issues);
  });

  it('returns 500 for unexpected errors', async () => {
    const handler = withErrorHandler(async () => {
      throw new Error('database exploded');
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.statusCode).toBe(500);
    expect(typeof body.error).toBe('string');
  });

  it('does not leak stack traces in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error — overriding read-only for test
    process.env.NODE_ENV = 'production';
    const handler = withErrorHandler(async () => {
      throw new Error('secret internal detail');
    });
    const res = await handler(makeRequest());
    const body = await res.json();
    expect(body.error).not.toContain('secret internal detail');
    // @ts-expect-error
    process.env.NODE_ENV = originalEnv;
  });
});
