import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

/**
 * Create a Supabase client that uses the user's JWT from cookies.
 * This client respects RLS policies — the user can only access their own data.
 * Use this for ALL data reads/writes on behalf of the user.
 */
export function createUserClient(request: NextRequest): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createSSRClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // setAll is a no-op here — cookie refresh is handled by middleware
      setAll() {},
    },
  });
}

/**
 * Create a service-role Supabase client.
 * This bypasses RLS — use ONLY for:
 *   1. Audit log inserts (append-only, no user context needed)
 *   2. System-level operations (cron, cleanup)
 *
 * NEVER use this to read/write user data.
 */
export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey);
}

/**
 * @deprecated Use createUserClient(request) for user data operations
 * or createServiceClient() for audit logging.
 * Kept temporarily for backward compatibility during migration.
 */
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || (!serviceKey && !anonKey)) {
    return null;
  }

  return createClient(url, serviceKey || anonKey!);
}
