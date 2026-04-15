import { ValidationError } from '@/lib/validation/schemas';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

/**
 * Wraps an App Router route handler with structured error handling.
 *
 * - `ValidationError` (thrown by `parseOrThrow`) → 422 with `issues` array
 * - Any other thrown value → 500 with sanitised message
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

      // Log unexpected errors — replace with structured logger when available
      console.error('[withErrorHandler] Unhandled error:', err);

      const message =
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again.'
          : err instanceof Error
          ? err.message
          : String(err);

      return Response.json(
        { error: message, statusCode: 500 },
        { status: 500 }
      );
    }
  };
}
