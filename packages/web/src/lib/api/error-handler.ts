/**
 * withErrorHandler — wraps every App Router route handler.
 *
 * Catches ValidationError (from parseOrThrow) and returns a structured 422
 * with field-level `issues` so the UI can surface inline errors.
 * Catches all other errors and returns a safe 500 without leaking internals.
 *
 * CLAUDE.md mandate: every route uses BOTH parseOrThrow AND withErrorHandler.
 *
 * @example
 * export const POST = withErrorHandler(async (req) => {
 *   const data = parseOrThrow(IntakeSchema, await req.json());
 *   return Response.json({ ok: true, data });
 * });
 */
import { ValidationError } from '@/lib/validation/schemas';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: unknown): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      // ── Validation errors (422) ──────────────────────────────────────────
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

      // ── Unexpected errors (500) ──────────────────────────────────────────
      // Log the real error server-side; never leak internals to the client.
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
