'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/brand/Logo';

const NAV = [
  { href: '/intake', label: 'Intake' },
  { href: '/employers', label: 'Employers' },
  { href: '/caseload', label: 'Case Manager' },
];

export function SiteHeader() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);

  useEffect(() => {
    // Probe /api/po/me — 200 if signed-in case_manager. Failures are silent.
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/po/me', { cache: 'no-store', credentials: 'include' });
        if (!r.ok) { if (!cancelled) setSignedInAs(null); return; }
        const d = await r.json();
        if (!cancelled) setSignedInAs(d?.fullName ?? null);
      } catch {
        if (!cancelled) setSignedInAs(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  async function handleSignOut() {
    await fetch('/api/po/logout', { method: 'POST' }).catch(() => { /* ignore */ });
    setSignedInAs(null);
    router.push('/po/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center text-slate-900 hover:text-primary-700 transition">
          <LogoMark subtitle="Action Navigator" />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  active
                    ? 'bg-primary-50 text-primary-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          {signedInAs ? (
            <div className="ml-3 flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden lg:inline">
                Signed in as <span className="font-semibold text-slate-700">{signedInAs}</span>
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/intake"
              className="ml-3 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 transition"
            >
              Start intake
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3"
          aria-label="Primary mobile"
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              {n.label}
            </Link>
          ))}
          {signedInAs ? (
            <button
              type="button"
              onClick={() => { setOpen(false); void handleSignOut(); }}
              className="mt-2 block w-full rounded-md bg-slate-100 px-3 py-2 text-center text-base font-medium text-slate-700"
            >
              Sign out ({signedInAs})
            </button>
          ) : (
            <Link
              href="/intake"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-md bg-slate-900 px-3 py-2 text-center text-base font-semibold text-white"
            >
              Start intake
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
