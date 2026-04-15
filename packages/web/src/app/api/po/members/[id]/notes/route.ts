import { NextRequest, NextResponse } from 'next/server';
import { createUserClient } from '@/lib/supabase-server';

type Params = Promise<{ id: string }>;

async function requireCaseManager(req: NextRequest) {
  const supabase = createUserClient(req);
  if (!supabase) return { error: 'Supabase not configured', status: 503 as const };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in', status: 401 as const };

  const { data: me } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!me || me.role !== 'case_manager') {
    return { error: 'Not provisioned as a case manager', status: 403 as const };
  }
  return { supabase, userId: me.id };
}

/** GET /api/po/members/[id]/notes — all notes on this citizen, RLS-scoped. */
export async function GET(req: NextRequest, ctx: { params: Params }) {
  const guard = await requireCaseManager(req);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const { data, error } = await guard.supabase
    .from('case_manager_notes')
    .select('id, body, severity, follow_up, created_at, updated_at, author_id')
    .eq('citizen_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, notes: data ?? [] });
}

/** POST /api/po/members/[id]/notes — add a note. RLS enforces ownership. */
export async function POST(req: NextRequest, ctx: { params: Params }) {
  const guard = await requireCaseManager(req);
  if ('error' in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const severity =
    typeof body.severity === 'string' && ['info', 'watch', 'escalate'].includes(body.severity)
      ? body.severity
      : 'info';
  const followUp = Boolean(body.follow_up);

  if (!text) {
    return NextResponse.json({ error: 'Note body required' }, { status: 422 });
  }

  const { data, error } = await guard.supabase
    .from('case_manager_notes')
    .insert({
      citizen_id: id,
      author_id: guard.userId,
      body: text,
      severity,
      follow_up: followUp,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, note: data }, { status: 201 });
}
