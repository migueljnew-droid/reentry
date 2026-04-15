import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

export function AppShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader />
      <main className={`flex-1 ${className}`}>{children}</main>
      <SiteFooter />
    </div>
  );
}
