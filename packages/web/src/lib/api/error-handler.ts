/**
 * Reentry Navigator — Shared API Error Handler
 *
 * Use this in every App Router route handler to ensure consistent,
 * structured error responses. Catches ValidationError from parseOrThrow
 * and returns field-level issues so the UI can surface them inline.
 *
 * @example
 * ```ts
 * import { withErrorHandler } from '@/lib/api/error-handler';
 * import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';
 *
 * export const POST = withErrorHandler(async (req: Request) => {
 *   const data = parseOrThrow(IntakeSchema, await req.json());
 *   // ... business logic
 *   return Response.json({ ok: true });
 * });
 * ```
 */

import { NextResponse } from 'next/server';
import { ValidationError } from '@/lib/validation/schemas';

export interface ApiErrorBody {
  error: string;
  statusCode: number;
  issues?: Array<{
    path: (string | number)[];
    message: string;
    code: string;
  }>;
}

/**
 * Wraps an App Router handler with structured error handling.
 * - ValidationError (422): returns field-level Zod issues
 * - Generic Error: returns 500 with message (no stack in production)
 */
export function withErrorHandler(
  handler: (req: Request, ctx?: unknown) => Promise<Response>
): (req: Request, ctx?: unknown) => Promise<Response> {
  return async (req: Request, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ValidationError) {
        const body: ApiErrorBody = {
          error: 'Validation failed',
          statusCode: 422,
          issues: err.issues.map((issue) => ({
            path: issue.path as (string | number)[],
            message: issue.message,
            code: issue.code,
          })),
        };
        return NextResponse.json(body, { status: 422 });
      }

      // Log unexpected errors server-side (replace with structured logger when available)
      console.error('[API Error]', {
        url: req.url,
        method: req.method,
        error: err instanceof Error ? err.message : String(err),
        // Never log stack in production to avoid leaking internals
        ...(process.env.NODE_ENV !== 'production' && err instanceof Error
          ? { stack: err.stack }
          : {}),
      });

      const body: ApiErrorBody = {
        error:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err instanceof Error
            ? err.message
            : String(err),
        statusCode: 500,
      };
      return NextResponse.json(body, { status: 500 });
    }
  };
}
