import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for API routes
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || (!serviceKey && !anonKey)) {
    return null;
  }

  return createClient(url, serviceKey || anonKey!);
}
