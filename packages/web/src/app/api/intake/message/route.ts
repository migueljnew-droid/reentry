import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/validate';
import { intakeMessageSchema } from '@/lib/schemas';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateRequest(intakeMessageSchema, body);
  if (!validated.success) return validated.response;

  const { sessionId, message } = validated.data;

  await logAudit({
    action: 'create',
    resourceType: 'intake_messages',
    resourceId: sessionId,
    // Never log the actual message content (PII) — only the session reference
    request: req,
  });

  return NextResponse.json({
    sessionId,
    reply: `Got it: "${message}". Processing...`,
    stage: 'processing',
  });
}
