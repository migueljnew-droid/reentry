import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export function validateRequest<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    // Zod v4 uses .issues, Zod v3 used .errors — support both
    const errorObj = result.error as unknown as Record<string, unknown>;
    const issues = (errorObj.issues ?? errorObj.errors ?? []) as Array<{ path: (string | number)[]; message: string }>;
    const details = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Validation failed', details },
        { status: 422 }
      ),
    };
  }

  return { success: true, data: result.data };
}

export function parseJsonBody(body: unknown): unknown {
  if (body === null || body === undefined) {
    return {};
  }
  return body;
}

export function formatZodError(error: ZodError): string {
  // Zod v4 uses .issues, Zod v3 used .errors — support both
  const errorObj = error as unknown as Record<string, unknown>;
  const issues = (errorObj.issues ?? errorObj.errors ?? []) as Array<{ path: (string | number)[]; message: string }>;
  return issues
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join('; ');
}
