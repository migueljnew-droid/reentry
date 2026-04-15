/**
 * Canonical Zod schemas for all API route validation.
 *
 * CLAUDE.md mandate: every route handler calls parseOrThrow(Schema, body)
 * before any business logic. Add new schemas here as new routes are created.
 * Export both the Zod schema AND its inferred TypeScript type.
 *
 * parseOrThrow throws a ValidationError (statusCode 422) on failure so
 * withErrorHandler can return structured field-level errors to the UI.
 */
import { z } from 'zod';

// ── Shared primitives ────────────────────────────────────────────────────────

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
  .refine((v): v is typeof US_STATE_CODES[number] =>
    (US_STATE_CODES as readonly string[]).includes(v),
    { message: 'Must be a valid 2-letter US state code or FED' }
  );

export type StateCode = z.infer<typeof StateCodeSchema>;

// ── Intake schema ────────────────────────────────────────────────────────────

/**
 * Submitted by the voice/text intake flow.
 * releaseDate and releaseState drive all downstream eligibility calculations
 * — wrong values here cause silent failures in resource lists.
 */
export const IntakeSchema = z.object({
  /** ISO-8601 date string, e.g. "2024-03-15" */
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO-8601 date (YYYY-MM-DD)'),

  releaseState: StateCodeSchema,

  /** Free-text county/city — used for shelter/resource geo-filtering */
  releaseCounty: z.string().min(1).max(100).optional(),

  convictionTypes: z
    .array(z.string().min(1).max(200))
    .max(20)
    .optional()
    .default([]),

  /** Whether the user wants voice-first responses */
  voiceMode: z.boolean().optional().default(false),

  /** Preferred language (BCP-47 tag, e.g. "en", "es") */
  language: z.string().min(2).max(10).optional().default('en'),
});

export type IntakeInput = z.infer<typeof IntakeSchema>;

// ── Benefits screening schema ────────────────────────────────────────────────

export const BenefitsScreeningSchema = z.object({
  state: StateCodeSchema,
  householdSize: z.number().int().min(1).max(20),
  monthlyIncome: z.number().min(0).max(1_000_000),
  hasChildren: z.boolean().optional().default(false),
  isVeteran: z.boolean().optional().default(false),
  hasDisability: z.boolean().optional().default(false),
});

export type BenefitsScreeningInput = z.infer<typeof BenefitsScreeningSchema>;

// ── Shared error helper ──────────────────────────────────────────────────────

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
 * Parse `data` against `schema`. Returns the typed value on success.
 * Throws ValidationError (statusCode 422) on failure — caught by withErrorHandler.
 *
 * @example
 * const body = parseOrThrow(IntakeSchema, await req.json());
 */
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}
