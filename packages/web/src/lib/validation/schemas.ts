import { z } from 'zod';

// ─── US State Codes ────────────────────────────────────────────────────────────
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','FED',
] as const;

export type USStateCode = typeof US_STATES[number];

// ─── Intake Schema ──────────────────────────────────────────────────────────
export const IntakeSchema = z.object({
  /** ISO-8601 date string, must not be in the future */
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid calendar date')
    .refine(
      (d) => new Date(d) <= new Date(),
      'Release date cannot be in the future'
    ),

  releaseState: z
    .string()
    .toUpperCase()
    .refine(
      (s): s is USStateCode => (US_STATES as readonly string[]).includes(s),
      'Must be a valid 2-letter US state code or FED'
    ),

  convictionType: z
    .enum(['felony', 'misdemeanor', 'federal', 'unknown'])
    .default('unknown'),

  /** Optional — used for benefits screening */
  hasChildren: z.boolean().optional(),
  isVeteran: z.boolean().optional(),
  needsHousing: z.boolean().optional(),
  needsEmployment: z.boolean().optional(),
  needsSubstanceSupport: z.boolean().optional(),

  /** Voice transcript if intake was voice-first */
  voiceTranscript: z.string().max(4000).optional(),
});

export type IntakeInput = z.infer<typeof IntakeSchema>;

// ─── Resource Query Schema ──────────────────────────────────────────────────
export const ResourceQuerySchema = z.object({
  state: z
    .string()
    .toUpperCase()
    .refine(
      (s): s is USStateCode => (US_STATES as readonly string[]).includes(s),
      'Must be a valid 2-letter US state code or FED'
    ),
  category: z
    .enum(['housing', 'employment', 'benefits', 'legal', 'healthcare', 'all'])
    .default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ResourceQueryInput = z.infer<typeof ResourceQuerySchema>;

// ─── parseOrThrow helper ────────────────────────────────────────────────────
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
 * Parse `data` against `schema`. Returns the typed, parsed value on success.
 * Throws `ValidationError` (statusCode 422) on failure so `withErrorHandler`
 * can convert it to a structured JSON response.
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}
