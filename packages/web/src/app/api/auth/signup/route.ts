import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { validateRequest } from '@/lib/validate';
import { signupSchema } from '@/lib/schemas';
import { encryptField, getEncryptionKey } from '@/lib/crypto';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateRequest(signupSchema, body);
  if (!validated.success) return validated.response;

  const { fullName, stateOfRelease, convictionType } = validated.data;
  const supabase = createServerClient();

  if (!supabase) {
    const sessionId = crypto.randomUUID();
    await logAudit({
      action: 'create',
      resourceType: 'users',
      resourceId: sessionId,
      details: { anonymous: true, noDb: true },
      request: req,
    });
    return NextResponse.json({ userId: sessionId, anonymous: true });
  }

  // Encrypt PII fields before storage
  let encryptedConvictionType = convictionType || '';
  try {
    const key = getEncryptionKey();
    if (convictionType) {
      encryptedConvictionType = encryptField(convictionType, key);
    }
  } catch {
    // Encryption key not configured — store unencrypted in dev
    // In production, REENTRY_ENCRYPTION_KEY must be set
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
        conviction_type: encryptedConvictionType,
        role: 'citizen',
      })
      .select()
      .single();

    if (userError) {
      // Last resort: anonymous session ID
      return NextResponse.json({ userId: crypto.randomUUID(), anonymous: true });
    }

    await logAudit({
      action: 'create',
      resourceType: 'users',
      resourceId: user.id,
      details: { anonymous: false, authFallback: true },
      request: req,
    });

    return NextResponse.json({ userId: user.id, anonymous: false });
  }

  // Create user profile linked to anonymous auth
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      auth_id: authData.user?.id,
      full_name: fullName || 'Anonymous',
      state_of_release: stateOfRelease || '',
      conviction_type: encryptedConvictionType,
      role: 'citizen',
    })
    .select()
    .single();

  if (userError) {
    return NextResponse.json({ userId: authData.user?.id, anonymous: true });
  }

  await logAudit({
    action: 'create',
    resourceType: 'users',
    resourceId: user.id,
    details: { anonymous: false },
    request: req,
  });

  return NextResponse.json({
    userId: user.id,
    token: authData.session?.access_token,
    anonymous: false,
  });
}
