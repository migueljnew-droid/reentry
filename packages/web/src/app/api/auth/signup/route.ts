import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { phone, fullName } = await req.json();
  const supabase = createServerClient();

  if (!supabase) {
    // No DB — generate anonymous session
    const sessionId = crypto.randomUUID();
    return NextResponse.json({ userId: sessionId, token: sessionId });
  }

  // Phone-based signup — no email needed
  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone,
    password: crypto.randomUUID(), // Auto-generated, user uses OTP
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      auth_id: authData.user?.id,
      phone,
      full_name: fullName,
      state_of_release: '',
      conviction_type: '',
      role: 'citizen',
    })
    .select()
    .single();

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ userId: user.id, token: authData.session?.access_token });
}
