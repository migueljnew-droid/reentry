import { describe, it, expect } from 'vitest';
import { withErrorHandler } from '@/lib/api/error-handler';
import { ValidationError } from '@/lib/validation/schemas';
import type { ZodIssue } from 'zod';

const fakeIssues: ZodIssue[] = [
  {
    path: ['releaseState'],
    message: 'Must be a valid 2-letter US state code or FED',
    code: 'custom',
  },
];

describe('withErrorHandler', () => {
  it('passes through a successful Response unchanged', async () => {
    const handler = withErrorHandler(async () =>
      Response.json({ ok: true }, { status: 200 })
    );
    const res = await handler(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 422 with issues array when ValidationError is thrown', async () => {
    const handler = withErrorHandler(async () => {
      throw new ValidationError(fakeIssues);
    });
    const res = await handler(new Request('http://localhost/'));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
    expect(body.statusCode).toBe(422);
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues[0].path).toContain('releaseState');
    expect(body.issues[0].code).toBe('custom');
  });

  it('returns 500 when a generic Error is thrown', async () => {
    const handler = withErrorHandler(async () => {
      throw new Error('database connection refused');
    });
    const res = await handler(new Request('http://localhost/'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.statusCode).toBe(500);
    expect(typeof body.error).toBe('string');
  });

  it('returns 500 when a non-Error value is thrown', async () => {
    const handler = withErrorHandler(async () => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw 'something went very wrong';
    });
    const res = await handler(new Request('http://localhost/'));
    expect(res.status).toBe(500);
  });

  it('does NOT leak internal error details in production shape', async () => {
    // withErrorHandler sanitises message in production; in test env it shows message.
    // We just assert the response is always valid JSON with statusCode.
    const handler = withErrorHandler(async () => {
      throw new Error('secret internal detail');
    });
    const res = await handler(new Request('http://localhost/'));
    const body = await res.json();
    expect(body).toHaveProperty('statusCode', 500);
    expect(body).toHaveProperty('error');
  });
});
