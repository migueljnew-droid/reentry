import React from 'react';

/* ---------- Card ---------- */
export function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const Component = Tag as React.ElementType;
  return (
    <Component className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 pt-5 ${className}`}>{children}</div>;
}
export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 pb-5 pt-3 ${className}`}>{children}</div>;
}

/* ---------- Badge ---------- */
type BadgeTone = 'neutral' | 'primary' | 'success' | 'warn' | 'danger';
const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  primary: 'bg-primary-50 text-primary-800 ring-primary-200',
  success: 'bg-accent-50 text-accent-800 ring-accent-200',
  warn: 'bg-warm-50 text-warm-700 ring-warm-200',
  danger: 'bg-red-50 text-red-800 ring-red-200',
};

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------- StatCard ---------- */
export function StatCard({
  label,
  value,
  sub,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
}) {
  const toneBg =
    tone === 'danger'
      ? 'from-red-50 to-white border-red-200'
      : tone === 'warn'
      ? 'from-warm-50 to-white border-warm-200'
      : tone === 'success'
      ? 'from-accent-50 to-white border-accent-200'
      : tone === 'primary'
      ? 'from-primary-50 to-white border-primary-200'
      : 'from-white to-white border-slate-200';
  return (
    <div
      className={`rounded-xl border bg-gradient-to-b ${toneBg} p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-sm text-slate-500">{sub}</div>}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}

/* ---------- Hero ---------- */
export function Hero({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{subtitle}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
