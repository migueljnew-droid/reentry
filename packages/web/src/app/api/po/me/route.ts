import { NextRequest, NextResponse } from 'next/server';
import { createUserClient } from '@/lib/supabase-server';

/**
 * GET /api/po/me
 *
 * Returns the signed-in user's row + role. Used by the login flow to
 * verify role='case_manager' before redirecting into the portal.
 * Also the guard used by /caseload middleware.
 */
export async function GET(req: NextRequest) {
  const supabase = createUserClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data: row, error: rowErr } = await supabase
    .from('users')
    .select('id, auth_id, full_name, role, state_of_release')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (rowErr) {
    return NextResponse.json({ error: rowErr.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'No users row for this auth id' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    id: row.id,
    authId: row.auth_id,
    fullName: row.full_name,
    role: row.role,
    state: row.state_of_release,
  });
}
