import { ValidationError } from '@/lib/validation/schemas';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

/**
 * Wraps an App Router handler with structured error handling.
 *
 * - ValidationError  → 422 + { error, statusCode, issues }
 * - Any other thrown → 500 + { error, statusCode } (no stack in prod)
 *
 * Usage (see CLAUDE.md):
 *   export const POST = withErrorHandler(async (req) => { ... });
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
            issues: err.issues,
          },
          { status: 422 }
        );
      }

      // Log unexpected errors server-side only
      console.error('[withErrorHandler] Unhandled error:', err);

      const message =
        process.env.NODE_ENV === 'development' && err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.';

      return Response.json(
        {
          error: message,
          statusCode: 500,
        },
        { status: 500 }
      );
    }
  };
}
