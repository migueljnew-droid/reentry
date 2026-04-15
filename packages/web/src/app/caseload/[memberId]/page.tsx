import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Card, CardBody, CardHeader } from '@/components/ui/primitives';
import { MemberNotesClient } from './MemberNotesClient';

export const dynamic = 'force-dynamic';

type Params = Promise<{ memberId: string }>;

export default async function MemberDetailPage({ params }: { params: Params }) {
  const { memberId } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10 text-slate-700">
          <p>Supabase is not configured in this environment. Member details
          require a live connection.</p>
        </div>
      </AppShell>
    );
  }

  const cookieStore = await cookies();
  const supabase = createSSRClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/po/login?next=/caseload/' + memberId);

  const { data: me } = await supabase
    .from('users').select('role').eq('auth_id', user.id).maybeSingle();
  if (!me || me.role !== 'case_manager') {
    redirect('/po/login?error=role');
  }

  // Fetch the citizen via the SECURITY DEFINER RPC — RLS on users is
  // deliberately minimal (avoids recursion), so authorisation lives
  // inside get_caseload_member which checks case_assignments.
  const { data: rows, error } = await supabase.rpc('get_caseload_member', {
    p_citizen_id: memberId,
  });
  const member = Array.isArray(rows) ? rows[0] : null;

  if (error) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-10 text-red-700">Error: {error.message}</div>
      </AppShell>
    );
  }
  if (!member) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <div className="mb-6">
          <Link
            href="/caseload"
            className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-900"
          >
            <span aria-hidden="true">←</span> Back to caseload
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                  Client
                </div>
                <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
                  {member.full_name}
                </h1>
              </div>
              <div className="flex gap-2">
                <Badge tone="neutral">{member.state_of_release ?? '—'}</Badge>
                <Badge tone="neutral">{member.conviction_type ?? '—'}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">On caseload since</dt>
                <dd className="mt-1 text-slate-900">
                  {new Date(member.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Client ID</dt>
                <dd className="mt-1 font-mono text-slate-600 text-xs">{member.id}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <div className="mt-6">
          <MemberNotesClient memberId={member.id} />
        </div>
      </div>
    </AppShell>
  );
}
