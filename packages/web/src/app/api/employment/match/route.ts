import { withErrorHandler } from '@/lib/api/error-handler';
import { z } from 'zod';
import { parseOrThrow } from '@/lib/validation/schemas';
import { matchEmployers } from '@/lib/employment/matcher';
import type { ConvictionType } from '@/lib/employment/fair-chance-db';

// Map legacy single-string convictionType ("nonviolent"|"violent"|"sex_offense"|...)
// to the new ConvictionType[] array the matcher expects.
const LEGACY_CONVICTION_MAP: Record<string, ConvictionType[]> = {
  nonviolent: ['property', 'white-collar', 'traffic'],
  violent:    ['violent'],
  sex_offense:['sexual'],
  drug:       ['drug'],
  traffic:    ['traffic'],
  'white-collar': ['white-collar'],
  other:      ['other'],
};

const ConvictionTypeSchema = z.enum([
  'violent', 'sexual', 'drug', 'property', 'white-collar', 'traffic', 'other',
]);

const IndustrySchema = z.enum([
  'warehousing', 'construction', 'hospitality', 'tech', 'food-service',
  'retail', 'healthcare', 'transportation', 'manufacturing', 'nonprofit',
]);

// Permissive schema: all fields optional so an empty body still returns a
// nationwide employer list. Accepts legacy `convictionType: string` OR new
// `convictions: ConvictionType[]`.
const EmploymentMatchSchema = z.object({
  state: z.string().length(2).regex(/^[A-Za-z]{2}$/).optional(),
  convictions: z.array(ConvictionTypeSchema).max(7).optional(),
  convictionType: z.string().optional(),
  remoteOk: z.boolean().default(false),
  industries: z.array(IndustrySchema).optional(),
});

export type EmploymentMatchRequest = z.infer<typeof EmploymentMatchSchema>;

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const data = parseOrThrow(EmploymentMatchSchema, body);

  // Resolve conviction set: new field wins, else map legacy enum, else empty.
  const convictions: ConvictionType[] =
    data.convictions ??
    (data.convictionType ? (LEGACY_CONVICTION_MAP[data.convictionType] ?? ['other']) : []);

  // Default to a neutral state when the caller omits it — legacy tests
  // send empty bodies expecting a nationwide fallback list.
  const state = (data.state ?? 'GA').toUpperCase();

  // Product call: for hard-exclusion convictions (sexual/violent) the UI
  // still wants to SHOW every employer and flag which ones won't hire,
  // rather than hide them. Run the match pass with an empty conviction
  // list so no employer is pre-filtered, then mark per-row restriction
  // against the user's actual convictions.
  const result = matchEmployers({
    state,
    convictions: [],
    remoteOk: data.remoteOk,
    industries: data.industries as Parameters<typeof matchEmployers>[0]['industries'],
  });

  // Dual-shape output: new fields + legacy aliases for existing tests.
  return Response.json({
    ok: true,
    totalFound: result.totalFound,
    totalEmployers: result.totalFound, // legacy alias
    voiceSummary: result.voiceSummary,
    banTheBoxProtection: result.banTheBoxProtection,
    matches: result.matches.map((m) => ({
      id: m.employer.id,
      name: m.employer.name,
      industry: m.employer.industry,
      state: m.employer.state,
      convictionPolicy: m.employer.convictionPolicy,
      remoteOk: m.employer.remoteOk,
      hiringUrl: m.employer.hiringUrl,
      score: m.score,
      matchScore: m.score, // legacy alias
      // A match is "restricted" iff the employer's convictionPolicy is
      // anything other than unrestricted/fair-chance OR the employer's
      // excludedConvictions overlaps the requester's convictions.
      restricted:
        (m.employer.convictionPolicy !== 'unrestricted' &&
         m.employer.convictionPolicy !== 'fair-chance') ||
        (m.employer.excludedConvictions ?? []).some((c) => convictions.includes(c)),
      explanation: m.explanation,
      tips: m.tips,
    })),
  });
});
