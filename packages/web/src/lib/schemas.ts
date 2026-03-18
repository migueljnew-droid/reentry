import { z } from 'zod';

// Shared primitives
const uuid = z.string().uuid('Must be a valid UUID');
const stateCode = z
  .string()
  .length(2, 'State code must be 2 characters')
  .toUpperCase();
const message = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message cannot exceed 2000 characters')
  .trim();

// ==========================================
// Intake routes
// ==========================================

export const intakeStartSchema = z.object({
  language: z.enum(['en', 'es']).optional().default('en'),
});

export const intakeMessageSchema = z.object({
  sessionId: uuid,
  message,
});

// Voice route uses FormData — validated in route handler

// ==========================================
// Plan routes
// ==========================================

export const planGenerateSchema = z.object({
  state: stateCode,
  stateName: z.string().max(100).optional(),
  convictionType: z.string().min(1).max(100),
  releaseDate: z.string().optional(),
  immediateNeeds: z.array(z.string().max(100)).max(20).optional().default([]),
  hasChildren: z.boolean().optional().default(false),
  numberOfChildren: z.number().int().min(0).max(20).optional().default(0),
  hasSupportNetwork: z.boolean().optional().default(false),
  workHistory: z.string().max(1000).optional().default(''),
  education: z.string().max(500).optional().default(''),
  supervisionType: z.string().max(100).optional().default(''),
  familySituation: z.record(z.string(), z.unknown()).optional().default({}),
  skills: z.record(z.string(), z.unknown()).optional().default({}),
});

export const planSaveSchema = z.object({
  userId: uuid,
  plan: z.object({
    id: z.string().optional(),
    state: stateCode,
    phases: z
      .array(
        z.object({
          id: z.string(),
          steps: z.array(
            z.object({
              id: z.string().optional(),
              category: z.string(),
              title: z.string().max(500),
              description: z.string().max(2000).optional().default(''),
              instructions: z.array(z.string().max(1000)).optional().default([]),
              documentsNeeded: z.array(z.string().max(200)).optional().default([]),
              deadline: z.string().optional(),
              priority: z.number().int().min(0).max(10).optional().default(0),
            })
          ),
        })
      )
      .optional()
      .default([]),
  }),
});

export const planIdSchema = z.object({
  id: uuid,
});

export const stepUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
});

// ==========================================
// Auth routes
// ==========================================

export const signupSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200).trim(),
  stateOfRelease: stateCode.optional().default(''),
  convictionType: z.string().max(100).optional().default(''),
});

// ==========================================
// Benefits routes
// ==========================================

export const benefitsScreenSchema = z.object({
  userId: uuid,
  state: stateCode.optional(),
  income: z.number().min(0).optional(),
  dependents: z.number().int().min(0).max(20).optional(),
});

// ==========================================
// Employment routes
// ==========================================

export const employmentMatchSchema = z.object({
  state: stateCode.optional(),
  convictionType: z.string().max(100).optional().default(''),
  skills: z.array(z.string().max(100)).max(50).optional().default([]),
});

// ==========================================
// Housing routes
// ==========================================

export const housingSearchSchema = z.object({
  state: stateCode.optional(),
  convictionType: z.string().max(100).optional().default(''),
  needsImmediate: z.boolean().optional().default(false),
});

// ==========================================
// Consent routes (CJIS compliance)
// ==========================================

export const consentGrantSchema = z.object({
  consentType: z.enum(['data_processing', 'ai_recording', 'third_party_sharing']),
});

export const consentRevokeSchema = z.object({
  consentType: z.enum(['data_processing', 'ai_recording', 'third_party_sharing']),
});

// ==========================================
// Deadline routes
// ==========================================

export const deadlineCreateSchema = z.object({
  userId: uuid,
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime(),
  category: z.enum([
    'parole',
    'court',
    'benefits',
    'employment',
    'housing',
    'id',
    'legal',
    'supervision',
  ]),
  planStepId: uuid.optional(),
});
