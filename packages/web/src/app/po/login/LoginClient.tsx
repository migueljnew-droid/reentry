'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader } from '@/components/ui/primitives';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key);
}

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('po-demo@reentry.dev');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) throw signErr;

      // Verify role server-side — redirect to caseload if case_manager,
      // otherwise sign out + show clear message.
      const res = await fetch('/api/po/me', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok || body.role !== 'case_manager') {
        await supabase.auth.signOut();
        throw new Error(
          body.error ?? 'This account is not provisioned as a case manager.',
        );
      }
      router.push('/caseload');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-10 md:py-16">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary-700">
            Case Manager Portal
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900">
            Sign in
          </h1>
          <p className="mt-2 text-slate-600">
            Parole and probation officers only. Access is scoped to your
            assigned caseload.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 text-sm text-primary-900">
              <strong className="font-semibold">Demo access:</strong>{' '}
              <code className="font-mono">po-demo@reentry.dev</code> /{' '}
              <code className="font-mono">reentrypo2026!</code>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Work email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-500">
          Need an account? Email{' '}
          <a
            href="mailto:hello@fathers-can.com"
            className="text-primary-700 hover:underline"
          >
            hello@fathers-can.com
          </a>
          .
        </p>
      </div>
    </AppShell>
  );
}
