import { NextRequest, NextResponse } from 'next/server';
import { generateReentryPlan } from '@/app/actions/generate-plan';
import { validateRequest } from '@/lib/validate';
import { planGenerateSchema } from '@/lib/schemas';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateRequest(planGenerateSchema, body);
  if (!validated.success) return validated.response;

  // Cast needed: planGenerateSchema validates API fields; generateReentryPlan's
  // IntakeData interface includes additional fields (fullName, checkInFrequency)
  // that are populated upstream during intake flow, not in this API body.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = await generateReentryPlan(validated.data as any);

  await logAudit({
    action: 'generate',
    resourceType: 'action_plans',
    details: { state: validated.data.state },
    request: req,
  });

  return NextResponse.json({ plan });
}
