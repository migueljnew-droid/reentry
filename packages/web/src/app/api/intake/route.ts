import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';

/**
 * POST /api/intake
 *
 * Accepts a user's intake form, validates it, and forwards to the
 * Rust SOVEREIGN engine for action plan generation.
 *
 * Request body: IntakeInput (see packages/web/src/lib/validation/schemas.ts)
 * Response:     { ok: true, intakeId: string } | ValidationError 422
 */
export const POST = withErrorHandler(async (req: Request) => {
  const data = parseOrThrow(IntakeSchema, await req.json());

  // TODO: forward `data` to Rust API (Fly.io) and return the intakeId.
  // Placeholder response keeps the route functional during development.
  const intakeId = crypto.randomUUID();

  return Response.json(
    {
      ok: true,
      intakeId,
      // Echo back validated + coerced data so the client can confirm
      // what was actually stored (e.g. uppercased state code).
      intake: data,
    },
    { status: 201 }
  );
});
