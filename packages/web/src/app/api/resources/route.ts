import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow, ResourceQuerySchema } from '@/lib/validation/schemas';

/**
 * POST /api/resources
 *
 * Returns geocoded, category-filtered resources for a given state/ZIP.
 * Validates inputs strictly — a wrong state code silently returning an
 * empty list is actively harmful to a recently released person.
 *
 * Request body: ResourceQuery
 * Response:     { ok: true, resources: Resource[] }
 */
export const POST = withErrorHandler(async (req: Request) => {
  const query = parseOrThrow(ResourceQuerySchema, await req.json());

  // TODO: integrate 211.org API or Google Places with the validated query.
  // Stub response keeps the contract testable while integration is built.
  return Response.json({
    ok: true,
    query,
    resources: [],
    meta: {
      source: 'stub — 211.org integration pending',
      generatedAt: new Date().toISOString(),
    },
  });
});
