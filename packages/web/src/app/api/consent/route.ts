import { NextRequest, NextResponse } from 'next/server';
import { createUserClient } from '@/lib/supabase-server';
import { validateRequest } from '@/lib/validate';
import { consentGrantSchema, consentRevokeSchema } from '@/lib/schemas';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/consent — Return the user's current consent state.
 */
export async function GET(req: NextRequest) {
  const supabase = createUserClient(req);

  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the user's DB record
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!dbUser) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  const { data: consents, error } = await supabase
    .from('user_consents')
    .select('consent_type, granted_at, revoked_at')
    .eq('user_id', dbUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build consent state map
  const consentState: Record<string, { granted: boolean; grantedAt: string | null; revokedAt: string | null }> = {};
  for (const type of ['data_processing', 'ai_recording', 'third_party_sharing']) {
    const record = consents?.find((c: { consent_type: string }) => c.consent_type === type);
    consentState[type] = {
      granted: record ? !record.revoked_at : false,
      grantedAt: record?.granted_at ?? null,
      revokedAt: record?.revoked_at ?? null,
    };
  }

  await logAudit({
    action: 'read',
    resourceType: 'user_consents',
    resourceId: dbUser.id,
    request: req,
  });

  return NextResponse.json({ consents: consentState });
}

/**
 * POST /api/consent — Grant or revoke a consent.
 * Body: { consentType: string }
 * Query param: ?action=revoke to revoke (default is grant)
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const isRevoke = req.nextUrl.searchParams.get('action') === 'revoke';
  const schema = isRevoke ? consentRevokeSchema : consentGrantSchema;

  const validated = validateRequest(schema, body);
  if (!validated.success) return validated.response;

  const { consentType } = validated.data;

  const supabase = createUserClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the user's DB record
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!dbUser) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Extract IP for consent record
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : req.headers.get('x-real-ip') ?? null;

  if (isRevoke) {
    // Revoke: set revoked_at
    const { error } = await supabase
      .from('user_consents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', dbUser.id)
      .eq('consent_type', consentType);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAudit({
      action: 'revoke',
      resourceType: 'user_consents',
      resourceId: dbUser.id,
      details: { consentType },
      request: req,
    });

    return NextResponse.json({ consentType, granted: false, revokedAt: new Date().toISOString() });
  }

  // Grant: upsert consent record
  const { error } = await supabase
    .from('user_consents')
    .upsert(
      {
        user_id: dbUser.id,
        consent_type: consentType,
        granted_at: new Date().toISOString(),
        revoked_at: null,
        ip_address: ipAddress,
      },
      { onConflict: 'user_id,consent_type' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: 'grant',
    resourceType: 'user_consents',
    resourceId: dbUser.id,
    details: { consentType },
    request: req,
  });

  return NextResponse.json({ consentType, granted: true, grantedAt: new Date().toISOString() });
}
