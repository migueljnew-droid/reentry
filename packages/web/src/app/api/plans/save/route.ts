import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { userId, plan } = await req.json();
  const supabase = createServerClient();

  if (!supabase) {
    // No DB — return plan ID from memory
    return NextResponse.json({ planId: plan.id, saved: false });
  }

  // Save the action plan
  const { data: savedPlan, error: planError } = await supabase
    .from('action_plans')
    .insert({
      user_id: userId,
      state: plan.state,
      plan_data: plan,
      status: 'active',
    })
    .select()
    .single();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  // Save individual steps
  const steps = plan.phases?.flatMap((phase: { id: string; steps: Array<{ id: string; category: string; title: string; description: string; instructions: string[]; documentsNeeded: string[]; deadline: string; priority: number }> }) =>
    phase.steps.map((step: { id: string; category: string; title: string; description: string; instructions: string[]; documentsNeeded: string[]; deadline: string; priority: number }, index: number) => ({
      plan_id: savedPlan.id,
      phase: phase.id,
      category: step.category,
      title: step.title,
      description: step.description || '',
      instructions: step.instructions.map((text: string, i: number) => ({ order: i, text })),
      documents_needed: step.documentsNeeded || [],
      status: 'pending',
      priority: step.priority || 0,
      sort_order: index,
    }))
  ) || [];

  if (steps.length > 0) {
    await supabase.from('plan_steps').insert(steps);
  }

  return NextResponse.json({ planId: savedPlan.id, saved: true });
}
