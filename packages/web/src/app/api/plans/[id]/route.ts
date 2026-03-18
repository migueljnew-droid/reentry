import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid plan ID' }, { status: 422 });
  }

  const supabase = createServerClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: plan, error } = await supabase
    .from('action_plans')
    .select('*, plan_steps(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  await logAudit({
    action: 'read',
    resourceType: 'action_plans',
    resourceId: id,
    request: req,
  });

  return NextResponse.json({ plan });
}
