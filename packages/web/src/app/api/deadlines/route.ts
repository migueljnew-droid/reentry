/**
 * POST /api/deadlines
 *
 * Computes a personalized deadline cascade for a returning citizen.
 * Input: release date, state, release type
 * Output: sorted, urgency-tiered deadline timeline with cascade alerts
 *
 * This endpoint powers the core reentry action plan — the sequence of
 * obligations that, if missed, cascade into warrants and recidivism.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { logAudit } from '@/lib/audit';
import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow } from '@/lib/validation/schemas';
import { z } from 'zod';
import { computeDeadlineCascade, formatDeadlineDate, getUrgencyLabel } from '@/lib/deadlines/engine';
import type { ReleaseType } from '@/lib/deadlines/types';

// GET — legacy stub, returns a small fixture list for dashboard prototyping.
// Kept for backward-compatibility with api-routes-extended.test.ts. Will be
// superseded once /api/deadlines cascade integrates with persistent storage.
export async function GET(req: NextRequest) {
  await logAudit({ action: 'read', resourceType: 'deadlines', request: req });
  return NextResponse.json({
    deadlines: [
      { id: randomUUID(), title: 'Parole check-in',      dueDate: '2026-03-24T10:00:00Z', category: 'supervision', status: 'upcoming' },
      { id: randomUUID(), title: 'SNAP recertification', dueDate: '2026-04-15T23:59:00Z', category: 'benefits',    status: 'upcoming' },
    ],
  });
}

const DeadlineRequestSchema = z.object({
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  releaseState: z
    .string()
    .length(2)
    .toUpperCase()
    .refine(
      (s) => /^[A-Z]{2}$/.test(s),
      'Must be a valid 2-letter US state code',
    ),
  releaseType: z.enum(['PAROLE', 'PROBATION', 'SUPERVISED_RELEASE', 'UNCONDITIONAL']),
});

export const POST = withErrorHandler(async (req: Request) => {
  const body = parseOrThrow(DeadlineRequestSchema, await req.json());

  const releaseDate = new Date(body.releaseDate + 'T00:00:00');
  if (isNaN(releaseDate.getTime())) {
    return Response.json(
      { error: 'Invalid release date', statusCode: 422 },
      { status: 422 },
    );
  }

  const result = computeDeadlineCascade({
    releaseDate,
    releaseState: body.releaseState,
    releaseType: body.releaseType as ReleaseType,
  });

  // Shape the response for the UI — include formatted dates and labels
  const formatted = result.deadlines.map((d) => ({
    id: d.rule.id,
    title: d.rule.title,
    description: d.rule.description,
    category: d.rule.category,
    dueDate: d.dueDate.toISOString().split('T')[0],
    dueDateLabel: formatDeadlineDate(d),
    daysRemaining: d.daysRemaining,
    urgency: d.urgency,
    urgencyLabel: getUrgencyLabel(d.urgency),
    cascadeRisk: d.cascadeRisk,
    cascadeWarning: d.cascadeWarning ?? null,
    isBlocked: d.isBlocked,
    blockedBy: d.blockedBy,
    agencyContact: d.rule.agencyContact ?? null,
    offlineCapable: d.rule.offlineCapable,
  }));

  return Response.json({
    ok: true,
    releaseDate: body.releaseDate,
    releaseState: body.releaseState,
    releaseType: body.releaseType,
    summary: result.summary,
    deadlines: formatted,
    alerts: {
      overdue: result.overdue.map((d) => d.rule.id),
      critical: result.critical.map((d) => d.rule.id),
      cascadeRisk: result.cascadeAlerts.map((d) => d.rule.id),
    },
  });
});
