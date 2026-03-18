import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { validateRequest } from '@/lib/validate';
import { stepUpdateSchema } from '@/lib/schemas';
import { logAudit } from '@/lib/audit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { stepId } = await params;

  if (!z.string().uuid().safeParse(stepId).success) {
    return NextResponse.json({ error: 'Invalid step ID' }, { status: 422 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateRequest(stepUpdateSchema, body);
  if (!validated.success) return validated.response;

  const { status } = validated.data;
  const supabase = createServerClient();

  if (!supabase) {
    return NextResponse.json({ stepId, status, saved: false });
  }

  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  const { error } = await supabase
    .from('plan_steps')
    .update({ status, completed_at: completedAt })
    .eq('id', stepId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: 'update',
    resourceType: 'plan_steps',
    resourceId: stepId,
    details: { status },
    request: req,
  });

  return NextResponse.json({ stepId, status, saved: true });
}
