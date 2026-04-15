import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import CaseloadLiveDashboard from '../case-manager/CaseloadLiveDashboard';

export const metadata = {
  title: 'Caseload — REENTRY',
  description: 'Live caseload view for parole/probation officers.',
};

export const dynamic = 'force-dynamic';

/**
 * Server-side role gate. Redirects to /po/login unless the session
 * belongs to a users row with role='case_manager'. Keeps the dashboard
 * unreachable by URL-scraping even if someone guesses the route.
 */
export default async function CaseloadPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Dev/demo without Supabase configured → skip gate, render dashboard
  // with fixture data. Documented behavior.
  if (!url || !anonKey) return <CaseloadLiveDashboard />;

  const cookieStore = await cookies();
  const supabase = createSSRClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        /* no-op — middleware handles refresh */
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/po/login?next=/caseload');

  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!me || me.role !== 'case_manager') {
    redirect('/po/login?error=role');
  }

  return <CaseloadLiveDashboard />;
}
