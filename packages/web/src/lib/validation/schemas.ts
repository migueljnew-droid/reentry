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
// Intake schema — primary user-facing form
// ---------------------------------------------------------------------------

export const ConvictionTypeSchema = z.enum([
  'felony',
  'misdemeanor',
  'federal',
  'juvenile',
  'unknown',
]);

export const HousingStatusSchema = z.enum([
  'homeless',
  'shelter',
  'transitional',
  'family_friend',
  'stable',
  'unknown',
]);

export const IntakeSchema = z.object({
  /** ISO-8601 date string, e.g. "2024-03-15" */
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO-8601 date (YYYY-MM-DD)')
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid calendar date'),

  releaseState: StateCodeSchema,

  convictionType: ConvictionTypeSchema,

  housingStatus: HousingStatusSchema,

  /** Optional — used for employment matching */
  skills: z
    .array(z.string().min(1).max(100))
    .max(20, 'Maximum 20 skills')
    .optional()
    .default([]),

  /** Optional — used for benefits screening */
  hasChildren: z.boolean().optional(),

  /** Optional — used for benefits screening */
  hasDisability: z.boolean().optional(),

  /** Optional — voice session ID for correlation */
  sessionId: z.string().uuid().optional(),
});

export type IntakeInput = z.infer<typeof IntakeSchema>;

// ---------------------------------------------------------------------------
// Benefits screening schema
// ---------------------------------------------------------------------------

export const BenefitsScreeningSchema = z.object({
  releaseState: StateCodeSchema,
  convictionType: ConvictionTypeSchema,
  hasChildren: z.boolean(),
  hasDisability: z.boolean(),
  monthlyIncome: z
    .number()
    .nonnegative('Income cannot be negative')
    .max(1_000_000, 'Income value out of range'),
  householdSize: z
    .number()
    .int()
    .min(1)
    .max(20, 'Household size out of range'),
});

export type BenefitsScreeningInput = z.infer<typeof BenefitsScreeningSchema>;

// ---------------------------------------------------------------------------
// parseOrThrow — shared boundary validator
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
 * Parse `data` against `schema`. Returns the typed, validated value on
 * success. Throws `ValidationError` (statusCode 422) on failure so that
 * `withErrorHandler` can convert it to a structured JSON response.
 *
 * @example
 * const intake = parseOrThrow(IntakeSchema, await req.json());
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}
