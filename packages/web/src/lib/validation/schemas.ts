import { z } from 'zod';

// ── Intake / Onboarding ──────────────────────────────────────────────────────

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
] as const;

export type USState = typeof US_STATES[number];

export const IntakeSchema = z.object({
  /** ISO date string — release date cannot be in the future by more than 1 year */
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .refine((d) => {
      const date = new Date(d);
      const now = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);
      return date <= oneYearFromNow;
    }, 'Release date cannot be more than 1 year in the future'),

  state: z.enum(US_STATES, {
    errorMap: () => ({ message: 'Must be a valid US state abbreviation' }),
  }),

  county: z.string().min(2).max(100).optional(),

  convictionType: z
    .enum(['felony', 'misdemeanor', 'federal', 'unknown'])
    .default('unknown'),

  /** Comma-separated conviction categories for benefits eligibility */
  convictionCategories: z
    .array(
      z.enum([
        'drug_possession',
        'drug_trafficking',
        'violent',
        'sex_offense',
        'financial',
        'other',
      ])
    )
    .max(10)
    .default([]),

  needsHousing: z.boolean().default(false),
  needsEmployment: z.boolean().default(false),
  needsIdReplacement: z.boolean().default(false),
  needsBenefits: z.boolean().default(false),
  needsLegalAid: z.boolean().default(false),

  /** Optional — used for deadline reminders */
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number')
    .optional(),

  email: z.string().email().optional(),
});

export type IntakeInput = z.infer<typeof IntakeSchema>;

// ── Benefits Screening ───────────────────────────────────────────────────────

export const BenefitsScreeningSchema = z.object({
  state: z.enum(US_STATES),
  householdSize: z.number().int().min(1).max(20),
  monthlyIncome: z.number().min(0).max(1_000_000),
  hasChildren: z.boolean().default(false),
  isPregnant: z.boolean().default(false),
  isVeteran: z.boolean().default(false),
  isDisabled: z.boolean().default(false),
  convictionCategories: z
    .array(
      z.enum([
        'drug_possession',
        'drug_trafficking',
        'violent',
        'sex_offense',
        'financial',
        'other',
      ])
    )
    .max(10)
    .default([]),
});

export type BenefitsScreeningInput = z.infer<typeof BenefitsScreeningSchema>;

// ── Contact / Referral Form ──────────────────────────────────────────────────

export const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  message: z.string().min(10).max(5000),
  /** Honeypot — must be empty */
  website: z.literal('').optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

// ── Action Plan ──────────────────────────────────────────────────────────────

export const ActionPlanRequestSchema = z.object({
  intake: IntakeSchema,
  language: z.enum(['en', 'es']).default('en'),
  voiceMode: z.boolean().default(false),
});

export type ActionPlanRequest = z.infer<typeof ActionPlanRequestSchema>;

// ── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Parse and return typed data, or throw a structured error.
 * Use in API route handlers:
 *   const data = parseOrThrow(IntakeSchema, await req.json());
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    const err = new Error('Validation failed');
    (err as Error & { issues: typeof issues; statusCode: number }).issues = issues;
    (err as Error & { issues: typeof issues; statusCode: number }).statusCode = 422;
    throw err;
  }
  return result.data;
}
