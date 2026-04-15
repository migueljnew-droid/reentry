import { NextResponse } from 'next/server';
import { ValidationError } from '@/lib/validation/schemas';

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

/**
 * Wraps an App Router route handler with structured error handling.
 *
 * - ValidationError  → 422 + { error, statusCode, issues }
 * - Any other Error  → 500 + { error, statusCode } (message scrubbed in prod)
 *
 * Usage:
 *   export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: unknown): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json(
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

      // Unknown error — log server-side, return safe message to client
      console.error('[withErrorHandler] Unhandled error:', err);

      const message =
        process.env.NODE_ENV === 'development' && err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.';

      return NextResponse.json(
        { error: message, statusCode: 500 },
        { status: 500 }
      );
    }
  };
}
