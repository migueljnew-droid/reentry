import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/po/logout
 *
 * Signs the user out of Supabase (invalidates the refresh token) AND
 * clears every sb-* cookie from the response. Both sides are required
 * — clearing cookies alone leaves the refresh token valid server-side.
 */
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.json({ ok: true });

  if (url && anonKey) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          for (const c of cookies) {
            response.cookies.set(c.name, c.value, c.options);
          }
        },
      },
    });
    await supabase.auth.signOut().catch(() => { /* best-effort */ });
  }

  // Belt + suspenders: nuke any remaining sb-* cookies on the way out.
  for (const c of req.cookies.getAll()) {
    if (c.name.startsWith('sb-')) {
      response.cookies.set(c.name, '', { path: '/', expires: new Date(0) });
    }
  }
  return response;
}
