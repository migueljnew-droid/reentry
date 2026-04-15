/**
 * Reentry — Zod validation schemas
 *
 * All API route handlers MUST import from here and call parseOrThrow().
 * See CLAUDE.md §Input Validation for the contract.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** ISO-8601 date string (YYYY-MM-DD) */
const ISODateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format');

/** Two-letter US state code */
const StateCode = z
  .string()
  .length(2)
  .toUpperCase()
  .refine(
    (s) =>
      [
        'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
        'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
        'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
        'TX','UT','VT','VA','WA','WV','WI','WY','DC','FED',
      ].includes(s),
    { message: 'Invalid US state code' },
  );

// ---------------------------------------------------------------------------
// Intake schema — primary user-facing form
// ---------------------------------------------------------------------------

export const IntakeSchema = z.object({
  /** ISO date the user was / will be released */
  releaseDate: ISODateString,

  /** Two-letter state of release / current residence */
  state: StateCode,

  /** Broad conviction category — drives eligibility filtering */
  convictionType: z.enum([
    'nonviolent_drug',
    'nonviolent_property',
    'violent',
    'sex_offense',
    'dui',
    'other',
  ]),

  /** Self-reported needs — at least one required */
  needs: z
    .array(
      z.enum([
        'id_replacement',
        'housing',
        'employment',
        'benefits',
        'healthcare',
        'legal_aid',
        'transportation',
        'childcare',
        'education',
      ]),
    )
    .min(1, 'Select at least one need'),

  /** Optional — used for employment matching and resource proximity */
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Must be a valid ZIP code')
    .optional(),

  /** Optional voice transcript that seeded this intake */
  voiceTranscript: z.string().max(4000).optional(),
});

export type Intake = z.infer<typeof IntakeSchema>;

// ---------------------------------------------------------------------------
// Resource query schema — used by /api/resources route
// ---------------------------------------------------------------------------

export const ResourceQuerySchema = z.object({
  state: StateCode,
  need: z.enum([
    'id_replacement',
    'housing',
    'employment',
    'benefits',
    'healthcare',
    'legal_aid',
    'transportation',
    'childcare',
    'education',
  ]),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/)
    .optional(),
  /** Max results — default 20, max 100 */
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ResourceQuery = z.infer<typeof ResourceQuerySchema>;

// ---------------------------------------------------------------------------
// Action plan generation schema — sent to AI engine
// ---------------------------------------------------------------------------

export const ActionPlanRequestSchema = IntakeSchema.extend({
  /** Resume token from a previous session (optional) */
  resumeToken: z.string().uuid().optional(),
});

export type ActionPlanRequest = z.infer<typeof ActionPlanRequestSchema>;

// ---------------------------------------------------------------------------
// parseOrThrow — shared helper referenced in CLAUDE.md
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  readonly statusCode = 422;
  readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/**
 * Parse `data` against `schema` and return the typed result.
 * Throws a {@link ValidationError} (statusCode 422) on failure so that
 * API route error handlers can return structured field-level errors to the UI.
 *
 * @example
 * ```ts
 * import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';
 *
 * export async function POST(req: Request) {
 *   const data = parseOrThrow(IntakeSchema, await req.json());
 *   // data is fully typed — proceed safely
 * }
 * ```
 */
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}
