import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { fullName, stateOfRelease, convictionType } = await req.json();
  const supabase = createServerClient();

  if (!supabase) {
    const sessionId = crypto.randomUUID();
    return NextResponse.json({ userId: sessionId, anonymous: true });
  }

  // Anonymous sign-in — no phone, no email, no friction
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

  if (authError) {
    // Fallback: create user directly without auth
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        full_name: fullName || 'Anonymous',
        state_of_release: stateOfRelease || '',
        conviction_type: convictionType || '',
        role: 'citizen',
      })
      .select()
      .single();

    if (userError) {
      // Last resort: anonymous session ID
      return NextResponse.json({ userId: crypto.randomUUID(), anonymous: true });
    }

    return NextResponse.json({ userId: user.id, anonymous: false });
  }

  // Create user profile linked to anonymous auth
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      auth_id: authData.user?.id,
      full_name: fullName || 'Anonymous',
      state_of_release: stateOfRelease || '',
      conviction_type: convictionType || '',
      role: 'citizen',
    })
    .select()
    .single();

  if (userError) {
    return NextResponse.json({ userId: authData.user?.id, anonymous: true });
  }

  return NextResponse.json({
    userId: user.id,
    token: authData.session?.access_token,
    anonymous: false,
  });
}
