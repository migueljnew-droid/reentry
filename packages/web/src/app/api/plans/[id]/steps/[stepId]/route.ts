import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { stepId } = await params;
  const { status } = await req.json();
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

  return NextResponse.json({ stepId, status, saved: true });
}
