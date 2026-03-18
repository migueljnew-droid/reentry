import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { validateRequest } from '@/lib/validate';
import { intakeStartSchema } from '@/lib/schemas';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Body is optional for start — default to empty object
    body = {};
  }

  const validated = validateRequest(intakeStartSchema, body);
  if (!validated.success) return validated.response;

  const sessionId = randomUUID();

  await logAudit({
    action: 'create',
    resourceType: 'intake_sessions',
    resourceId: sessionId,
    details: { language: validated.data.language },
    request: req,
  });

  return NextResponse.json({
    sessionId,
    reply: "Welcome to REENTRY. I'm here to build your personal reentry action plan. Let's start — what's your name?",
    stage: 'welcome',
  });
}
