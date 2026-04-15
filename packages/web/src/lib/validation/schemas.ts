import { z } from 'zod';

// ─── US State Codes ───────────────────────────────────────────────────────────
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','FED'
] as const;

export type USStateCode = typeof US_STATE_CODES[number];

// ─── Intake Schema ─────────────────────────────────────────────────────────────
export const IntakeSchema = z.object({
  /** ISO 8601 date string — the day the person was released */
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid calendar date')
    .refine(
      (d) => new Date(d) <= new Date(),
      'Release date cannot be in the future'
    ),

  /** 2-letter state code or FED for federal cases */
  releaseState: z
    .string()
    .toUpperCase()
    .refine(
      (s): s is USStateCode => (US_STATE_CODES as readonly string[]).includes(s),
      'Must be a valid 2-letter US state code or FED'
    ),

  /** Optional county within the release state */
  releaseCounty: z
    .string()
    .max(100, 'County name too long')
    .optional(),

  /** Conviction type affects employment matching and benefit eligibility */
  convictionType: z
    .enum(['felony', 'misdemeanor', 'federal', 'juvenile', 'unknown'])
    .default('unknown'),

  /** Whether the person is currently on parole/probation */
  supervisionStatus: z
    .enum(['parole', 'probation', 'none', 'unknown'])
    .default('unknown'),

  /** Primary needs — drives action plan ordering */
  primaryNeeds: z
    .array(
      z.enum([
        'id_documents',
        'housing',
        'employment',
        'benefits',
        'healthcare',
        'legal_aid',
        'substance_treatment',
        'mental_health',
        'family_reunification',
        'education',
      ])
    )
    .min(1, 'Select at least one primary need')
    .max(10),

  /** Optional: voice transcript that was parsed to produce this intake */
  voiceTranscript: z
    .string()
    .max(10_000, 'Transcript too long')
    .optional(),
});

export type IntakeData = z.infer<typeof IntakeSchema>;

// ─── Benefits Screening Schema ─────────────────────────────────────────────────
export const BenefitsScreeningSchema = z.object({
  state: z
    .string()
    .toUpperCase()
    .refine(
      (s): s is USStateCode => (US_STATE_CODES as readonly string[]).includes(s),
      'Must be a valid 2-letter US state code or FED'
    ),

  householdSize: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Household size must be at least 1')
    .max(20, 'Household size seems too large — please verify'),

  monthlyIncome: z
    .number()
    .min(0, 'Income cannot be negative')
    .max(1_000_000, 'Income value seems too large — please verify'),

  hasChildren: z.boolean().default(false),

  isVeteran: z.boolean().default(false),

  hasDisability: z.boolean().default(false),

  convictionType: z
    .enum(['felony', 'misdemeanor', 'federal', 'juvenile', 'unknown'])
    .default('unknown'),

  /** Drug-related felony affects SNAP/TANF eligibility in many states */
  hasDrugFelony: z.boolean().default(false),

  /** Sex offense registration affects housing program eligibility */
  isSexOffenseRegistrant: z.boolean().default(false),
});

export type BenefitsScreeningData = z.infer<typeof BenefitsScreeningSchema>;

// ─── Employment Search Schema ──────────────────────────────────────────────────
export const EmploymentSearchSchema = z.object({
  state: z
    .string()
    .toUpperCase()
    .refine(
      (s): s is USStateCode => (US_STATE_CODES as readonly string[]).includes(s),
      'Must be a valid 2-letter US state code or FED'
    ),

  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Must be a valid US ZIP code')
    .optional(),

  skills: z
    .array(z.string().max(100))
    .max(20, 'Too many skills listed')
    .default([]),

  convictionType: z
    .enum(['felony', 'misdemeanor', 'federal', 'juvenile', 'unknown'])
    .default('unknown'),

  willingToRelocate: z.boolean().default(false),

  transportationAccess: z
    .enum(['own_vehicle', 'public_transit', 'none'])
    .default('none'),
});

export type EmploymentSearchData = z.infer<typeof EmploymentSearchSchema>;

// ─── Deadline Schema ───────────────────────────────────────────────────────────
export const DeadlineSchema = z.object({
  userId: z.string().uuid('Must be a valid user ID'),

  deadlineType: z.enum([
    'parole_checkin',
    'probation_checkin',
    'court_date',
    'benefits_recertification',
    'id_renewal',
    'housing_application',
    'employment_followup',
    'custom',
  ]),

  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid calendar date'),

  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),

  notes: z.string().max(2000, 'Notes too long').optional(),

  reminderDaysBefore: z
    .number()
    .int()
    .min(0)
    .max(30)
    .default(1),
});

export type DeadlineData = z.infer<typeof DeadlineSchema>;

// ─── Resource Query Schema ─────────────────────────────────────────────────────
// Silent empty lists are dangerous for recently released users searching for
// housing/food/work — validate the query boundary strictly before any lookup.
export const ResourceQuerySchema = z.object({
  state: z.enum(US_STATE_CODES, {
    message: 'State must be a valid US state/territory code',
  }),

  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'ZIP must be 5 digits or ZIP+4 format')
    .optional(),

  category: z.enum([
    'housing',
    'food',
    'employment',
    'healthcare',
    'legal',
    'benefits',
    'transportation',
    'childcare',
    'education',
    'mental_health',
    'substance_abuse',
    'reentry_services',
  ]).optional(),

  radiusMiles: z.number().int().min(1).max(100).default(25),

  limit: z.number().int().min(1).max(100).default(20),
});

export type ResourceQueryData = z.infer<typeof ResourceQuerySchema>;

// ─── Shared Error Helper ───────────────────────────────────────────────────────
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
 * Parse `data` against `schema`. Returns the typed result on success.
 * Throws `ValidationError` (statusCode 422) on failure so `withErrorHandler`
 * can return structured field-level errors to the UI.
 *
 * @example
 * const intake = parseOrThrow(IntakeSchema, await req.json());
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
