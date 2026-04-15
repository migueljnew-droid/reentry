/**
 * withErrorHandler — wraps every App Router route handler.
 *
 * Catches ValidationError (from parseOrThrow) and any unexpected Error,
 * returning structured JSON so the UI can surface field-level messages.
 *
 * Usage (from CLAUDE.md):
 *
 *   export const POST = withErrorHandler(async (req: Request) => {
 *     const data = parseOrThrow(IntakeSchema, await req.json());
 *     return Response.json({ ok: true, data });
 *   });
 */
import { ValidationError } from '@/lib/validation/schemas';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

/**
 * Structured error shape returned to clients.
 */
interface ErrorBody {
  error: string;
  statusCode: number;
  issues?: { path: (string | number)[]; message: string; code: string }[];
}

function jsonError(body: ErrorBody, status: number): Response {
  return Response.json(body, { status });
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: unknown): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ValidationError) {
        return jsonError(
          {
            error: 'Validation failed',
            statusCode: 422,
            issues: err.issues,
          },
          422
        );
      }

      // Log unexpected errors server-side without leaking internals
      console.error('[withErrorHandler] Unhandled error:', err);

      return jsonError(
        {
          error: 'An unexpected error occurred. Please try again.',
          statusCode: 500,
        },
        500
      );
    }
  };
}
