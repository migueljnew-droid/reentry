/**
 * Validation schemas for all REENTRY API routes.
 *
 * RULE (from CLAUDE.md): Every route handler MUST call parseOrThrow before
 * any business logic. Add new schemas here and export both the Zod schema
 * and its inferred TypeScript type.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Valid 2-letter US state codes + FED for federal-only queries */
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','FED',
] as const;

export const StateCodeSchema = z
  .string()
  .toUpperCase()
  .refine((v): v is typeof US_STATE_CODES[number] => (US_STATE_CODES as readonly string[]).includes(v), {
    message: 'Must be a valid 2-letter US state code or FED',
  });

export type StateCode = z.infer<typeof StateCodeSchema>;

// ---------------------------------------------------------------------------
// Intake — primary conversational intake form
// ---------------------------------------------------------------------------

export const IntakeSchema = z.object({
  /** ISO-8601 date string, e.g. "2024-03-15" */
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO-8601 date (YYYY-MM-DD)')
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid calendar date'),

  releaseState: StateCodeSchema,

  /** County or city within the release state (optional but improves resource matching) */
  releaseCounty: z.string().max(100).optional(),

  /** Broad conviction category — used for employment matching and benefit eligibility */
  convictionType: z.enum([
    'drug',
    'property',
    'violent',
    'sex_offense',
    'white_collar',
    'dui',
    'other',
  ]),

  /** Whether the user is currently on parole or probation */
  supervisionStatus: z.enum(['parole', 'probation', 'none', 'unknown']),

  /** Self-reported housing situation on release */
  housingSituation: z
    .enum(['family', 'halfway_house', 'shelter', 'none', 'unknown'])
    .optional(),

  /** Whether the user has a valid government-issued ID */
  hasId: z.boolean().optional(),

  /** Preferred contact / delivery channel */
  preferredChannel: z.enum(['web', 'sms', 'voice']).default('web'),
});

export type Intake = z.infer<typeof IntakeSchema>;

// ---------------------------------------------------------------------------
// Resource query — used by /api/resources route
// ---------------------------------------------------------------------------

export const ResourceQuerySchema = z.object({
  state: StateCodeSchema,
  county: z.string().max(100).optional(),
  categories: z
    .array(
      z.enum([
        'housing',
        'food',
        'employment',
        'legal',
        'healthcare',
        'id_documents',
        'benefits',
        'transportation',
        'mental_health',
        'substance_use',
      ])
    )
    .min(1, 'At least one category is required')
    .max(10),
  convictionType: z
    .enum(['drug', 'property', 'violent', 'sex_offense', 'white_collar', 'dui', 'other'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ResourceQuery = z.infer<typeof ResourceQuerySchema>;

// ---------------------------------------------------------------------------
// Action plan request
// ---------------------------------------------------------------------------

export const ActionPlanRequestSchema = z.object({
  intakeId: z.string().uuid('Must be a valid UUID referencing a stored intake record'),
  /** Override the AI model for cost routing — defaults to server-side decision */
  modelHint: z.enum(['fast', 'balanced', 'thorough']).optional(),
});

export type ActionPlanRequest = z.infer<typeof ActionPlanRequestSchema>;

// ---------------------------------------------------------------------------
// parseOrThrow — the single entry point used by all route handlers
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  readonly statusCode = 422;
  readonly issues: { path: (string | number)[]; message: string; code: string }[];

  constructor(issues: { path: (string | number)[]; message: string; code: string }[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/**
 * Parse `data` against `schema`. Returns the typed, coerced value on success.
 * Throws `ValidationError` (statusCode 422) on failure so `withErrorHandler`
 * can convert it to a structured JSON response.
 *
 * @example
 * const body = parseOrThrow(IntakeSchema, await req.json());
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  throw new ValidationError(
    result.error.issues.map((issue) => ({
      path: issue.path as (string | number)[],
      message: issue.message,
      code: issue.code,
    }))
  );
}
