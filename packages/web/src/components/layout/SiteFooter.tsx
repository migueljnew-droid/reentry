import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
        <div className="flex items-center gap-2.5 text-slate-800">
          <Logo size={22} color="currentColor" />
          <span className="font-display font-semibold">REENTRY</span>
          <span className="text-slate-400">·</span>
          <span>An advocate in your pocket.</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
          <Link href="/intake" className="hover:text-slate-900">Intake</Link>
          <Link href="/employers" className="hover:text-slate-900">Employers</Link>
          <Link href="/caseload" className="hover:text-slate-900">Case Manager</Link>
          <Link href="/api/health" className="hover:text-slate-900">Status</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-6 text-xs text-slate-400" suppressHydrationWarning>
        © {new Date().getFullYear()} FathersCAN, Inc. · For education only. Not legal advice.
      </div>
    </footer>
  );
}
