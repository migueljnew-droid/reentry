import { describe, it, expect, vi } from 'vitest';
import { withErrorHandler } from '@/lib/api/error-handler';
import { ValidationError } from '@/lib/validation/schemas';
import type { ZodIssue } from 'zod';

const makeRequest = () => new Request('http://localhost/api/test', { method: 'POST' });

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
    const issues: ZodIssue[] = [
      {
        path: ['releaseState'],
        message: 'Must be a valid 2-letter US state code or FED',
        code: 'custom',
      },
    ];

    const handler = withErrorHandler(async () => {
      throw new ValidationError(issues);
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error).toBe('Validation failed');
    expect(body.statusCode).toBe(422);
    expect(body.issues).toHaveLength(1);
    expect(body.issues[0].path).toContain('releaseState');
    expect(body.issues[0].message).toMatch(/state code/i);
  });

  it('returns 500 for unexpected errors without leaking internals', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = withErrorHandler(async () => {
      throw new Error('DB connection refused — secret internal detail');
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.statusCode).toBe(500);
    // Must NOT leak internal error message to client
    expect(JSON.stringify(body)).not.toContain('DB connection refused');
    expect(JSON.stringify(body)).not.toContain('secret internal detail');

    consoleSpy.mockRestore();
  });

  it('logs unexpected errors server-side', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = withErrorHandler(async () => {
      throw new Error('something broke');
    });

    await handler(makeRequest());
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[withErrorHandler]'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
