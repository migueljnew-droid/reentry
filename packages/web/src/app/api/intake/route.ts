import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';

/**
 * POST /api/intake
 *
 * Accepts a reentry intake payload, validates it, and returns a typed
 * confirmation. Downstream: action plan generation, benefits screening.
 *
 * Validation errors return 422 + structured `issues` array so the UI
 * can surface field-level messages — critical for low-literacy users.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const data = parseOrThrow(IntakeSchema, await req.json());

  // TODO: pass `data` to the SOVEREIGN action-plan generator
  // const plan = await generateActionPlan(data);

  return Response.json({
    ok: true,
    received: {
      releaseDate: data.releaseDate,
      releaseState: data.releaseState,
      convictionType: data.convictionType,
    },
    // plan,
  });
});
