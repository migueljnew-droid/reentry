/**
 * Reentry Navigator — API Boundary Validation Schemas
 *
 * MANDATE (CLAUDE.md): All API route handlers MUST validate incoming data
 * with these Zod schemas before any business logic runs.
 *
 * parseOrThrow throws { statusCode: 422, issues: ZodIssue[] } on failure.
 * Catch in a shared error handler and return issues to the client so the
 * UI can surface field-level errors.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** ISO-8601 date string, e.g. "2024-03-15" */
const ISODateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO-8601 date (YYYY-MM-DD)');

/** Two-letter US state code or "FED" for federal-only queries */
const StateCode = z
  .string()
  .regex(
    /^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|FED)$/,
    'Must be a valid 2-letter US state code or FED'
  );

/** Conviction categories that affect employment/benefits eligibility */
const ConvictionType = z.enum([
  'nonviolent_drug',
  'violent',
  'sex_offense',
  'white_collar',
  'dui',
  'domestic_violence',
  'property',
  'other',
]);

/** Supervision status at release */
const SupervisionStatus = z.enum([
  'parole',
  'probation',
  'supervised_release',
  'unsupervised',
  'discharged',
]);

// ---------------------------------------------------------------------------
// Core Schemas
// ---------------------------------------------------------------------------

/**
 * IntakeSchema — primary intake form submitted after voice/text conversation.
 * Drives action plan generation, benefits screening, and employment matching.
 */
export const IntakeSchema = z.object({
  /** ISO-8601 release date — drives deadline calculations */
  releaseDate: ISODateString,

  /** State of release — determines which rule set to apply */
  releaseState: StateCode,

  /** State where the person will reside post-release (may differ) */
  residenceState: StateCode,

  /** Conviction type(s) — affects eligibility for housing, SNAP, employment */
  convictionTypes: z.array(ConvictionType).min(1, 'At least one conviction type required'),

  /** Supervision status — affects check-in deadlines and travel restrictions */
  supervisionStatus: SupervisionStatus,

  /** Whether the person has a valid government-issued ID at release */
  hasValidId: z.boolean(),

  /** Whether the person has a Social Security card */
  hasSocialSecurityCard: z.boolean(),

  /** Whether the person has a birth certificate */
  hasBirthCertificate: z.boolean(),

  /** Self-reported housing situation on release */
  housingStatus: z.enum([
    'has_housing',
    'family_or_friend',
    'transitional_housing',
    'shelter',
    'unsheltered',
    'unknown',
  ]),

  /** Employment situation */
  employmentStatus: z.enum([
    'has_job_offer',
    'seeking_employment',
    'unable_to_work',
    'unknown',
  ]),

  /** Optional: parole/probation officer contact for dashboard integration */
  supervisionOfficerEmail: z.string().email().optional(),

  /** Optional: preferred language for generated action plan */
  preferredLanguage: z.string().min(2).max(10).optional().default('en'),

  /** Optional: anonymized session ID for resumable form state */
  sessionId: z.string().uuid().optional(),
});

export type Intake = z.infer<typeof IntakeSchema>;

/**
 * ResourceQuerySchema — parameters for querying the resource database
 * (shelters, legal aid, employment, benefits offices).
 */
export const ResourceQuerySchema = z.object({
  state: StateCode,
  category: z.enum([
    'housing',
    'legal_aid',
    'employment',
    'benefits',
    'healthcare',
    'substance_use',
    'mental_health',
    'id_documents',
    'food',
    'transportation',
  ]),
  /** Lat/lng for proximity sorting — optional */
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  /** Max results to return */
  limit: z.number().int().min(1).max(50).optional().default(20),
  /** Offset for pagination */
  offset: z.number().int().min(0).optional().default(0),
});

export type ResourceQuery = z.infer<typeof ResourceQuerySchema>;

/**
 * ActionPlanRequestSchema — request to generate or regenerate an action plan.
 */
export const ActionPlanRequestSchema = z.object({
  intakeId: z.string().uuid('intakeId must be a valid UUID'),
  /** Force regeneration even if a cached plan exists */
  forceRegenerate: z.boolean().optional().default(false),
});

export type ActionPlanRequest = z.infer<typeof ActionPlanRequestSchema>;

/**
 * BenefitsScreeningSchema — request to screen against 100+ programs.
 */
export const BenefitsScreeningSchema = z.object({
  intakeId: z.string().uuid(),
  /** Subset of programs to screen; omit to screen all */
  programCategories: z
    .array(
      z.enum([
        'snap',
        'medicaid',
        'ssi',
        'ssdi',
        'tanf',
        'liheap',
        'lifeline',
        'pell_grant',
        'housing_voucher',
        'job_training',
      ])
    )
    .optional(),
});

export type BenefitsScreening = z.infer<typeof BenefitsScreeningSchema>;

/**
 * VoiceTranscriptSchema — payload from the voice intake pipeline.
 * The transcript is validated before being passed to the AI plan generator.
 */
export const VoiceTranscriptSchema = z.object({
  /** Raw transcript from Whisper API */
  transcript: z.string().min(1).max(10_000),
  /** Whisper-reported language code */
  detectedLanguage: z.string().min(2).max(10),
  /** Duration of the audio in seconds */
  durationSeconds: z.number().positive().max(600),
  /** Session ID to associate transcript with an in-progress intake */
  sessionId: z.string().uuid().optional(),
});

export type VoiceTranscript = z.infer<typeof VoiceTranscriptSchema>;

// ---------------------------------------------------------------------------
// parseOrThrow — shared parse helper (referenced in CLAUDE.md)
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  public readonly statusCode = 422;
  public readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/**
 * Parse `data` against `schema`. Returns the typed, validated value on
 * success. Throws `ValidationError` (statusCode 422) on failure so that
 * a shared error handler can return structured field-level errors to the
 * client without leaking internal stack traces.
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
  data: unknown
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}
