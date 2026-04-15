/**
 * Tests for packages/web/src/lib/api/error-handler.ts
 */
import { describe, it, expect } from 'vitest';
import { withErrorHandler } from '../../lib/api/error-handler';
import { ValidationError } from '../../lib/validation/schemas';

describe('withErrorHandler', () => {
  it('passes through successful responses unchanged', async () => {
    const handler = withErrorHandler(async () =>
      Response.json({ ok: true }, { status: 200 })
    );
    const res = await handler(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('converts ValidationError to 422 with issues array', async () => {
    const issues = [{ path: ['releaseState'], message: 'Invalid state', code: 'invalid_string' }];
    const handler = withErrorHandler(async () => {
      throw new ValidationError(issues);
    });
    const res = await handler(new Request('http://localhost/'));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.statusCode).toBe(422);
    expect(body.error).toBe('Validation failed');
    expect(body.issues).toEqual(issues);
  });

  it('converts unexpected errors to 500 without leaking internals', async () => {
    const handler = withErrorHandler(async () => {
      throw new Error('DB connection refused at 10.0.0.1:5432');
    });
    const res = await handler(new Request('http://localhost/'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.statusCode).toBe(500);
    // Must NOT leak the internal error message
    expect(JSON.stringify(body)).not.toContain('10.0.0.1');
    expect(JSON.stringify(body)).not.toContain('DB connection');
  });

  it('returns JSON content-type on error responses', async () => {
    const handler = withErrorHandler(async () => {
      throw new ValidationError([]);
    });
    const res = await handler(new Request('http://localhost/'));
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
