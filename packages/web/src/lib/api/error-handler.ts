import { ValidationError } from '@/lib/validation/schemas';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

/**
 * Wraps an App Router route handler with structured error handling.
 *
 * - ValidationError  → 422 with { error, statusCode, issues[] }
 * - Unknown errors   → 500 with { error, statusCode } (no leak of internals)
 *
 * MUST be used alongside parseOrThrow — see CLAUDE.md for the full pattern.
 *
 * @example
 * export const POST = withErrorHandler(async (req) => {
 *   const data = parseOrThrow(IntakeSchema, await req.json());
 *   return Response.json({ ok: true, data });
 * });
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: unknown): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ValidationError) {
        return Response.json(
          {
            error: 'Validation failed',
            statusCode: 422,
            issues: err.issues.map((issue) => ({
              path: issue.path,
              message: issue.message,
              code: issue.code,
            })),
          },
          { status: 422 }
        );
      }

      // Log unexpected errors server-side without leaking internals
      console.error('[withErrorHandler] Unhandled error:', err);

      return Response.json(
        {
          error: 'An unexpected error occurred. Please try again.',
          statusCode: 500,
        },
        { status: 500 }
      );
    }
  };
}
