import { z } from 'zod';

// ─── US State codes (50 states + DC + FED) ───────────────────────────────────
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','FED'
] as const;

export const StateCodeSchema = z
  .string()
  .toUpperCase()
  .refine((v): v is typeof US_STATE_CODES[number] => (US_STATE_CODES as readonly string[]).includes(v), {
    message: 'Must be a valid 2-letter US state code or FED',
  });

// ─── Intake ──────────────────────────────────────────────────────────────────
export const IntakeSchema = z.object({
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be ISO date: YYYY-MM-DD')
    .refine((d) => !isNaN(Date.parse(d)), 'Must be a valid calendar date'),
  releaseState: StateCodeSchema,
  currentZip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Must be a valid US ZIP code')
    .optional(),
  convictionTypes: z
    .array(z.string().min(1).max(120))
    .max(20, 'Too many conviction types')
    .optional()
    .default([]),
  hasChildren: z.boolean().optional(),
  needsHousing: z.boolean().optional(),
  needsEmployment: z.boolean().optional(),
  needsBenefits: z.boolean().optional(),
  needsIdReplacement: z.boolean().optional(),
  preferredLanguage: z.enum(['en', 'es', 'fr', 'zh', 'vi', 'ko']).default('en'),
});

export type IntakeInput = z.infer<typeof IntakeSchema>;

// ─── Resource lookup ─────────────────────────────────────────────────────────
export const ResourceQuerySchema = z.object({
  state: StateCodeSchema,
  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Must be a valid US ZIP code')
    .optional(),
  categories: z
    .array(
      z.enum([
        'housing',
        'employment',
        'benefits',
        'legal',
        'healthcare',
        'id',
        'education',
        'transportation',
      ])
    )
    .min(1, 'At least one category required')
    .max(8),
  radiusMiles: z.number().int().min(1).max(100).default(25),
});

export type ResourceQuery = z.infer<typeof ResourceQuerySchema>;

// ─── Action plan request ─────────────────────────────────────────────────────
export const ActionPlanRequestSchema = z.object({
  intakeId: z.string().uuid('Must be a valid UUID'),
  regenerate: z.boolean().default(false),
});

export type ActionPlanRequest = z.infer<typeof ActionPlanRequestSchema>;

// ─── parseOrThrow helper ─────────────────────────────────────────────────────
export class ValidationError extends Error {
  statusCode = 422;
  issues: { path: (string | number)[]; message: string; code: string }[];

  constructor(issues: { path: (string | number)[]; message: string; code: string }[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((i) => ({
        path: i.path,
        message: i.message,
        code: i.code,
      }))
    );
  }
  return result.data;
}
