'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Card, Skeleton, StatCard } from '@/components/ui/primitives';

type CaseloadSummary = {
  total?: number;
  averageRiskScore?: number;
  abscondedCount?: number;
  missedCheckInsTotal?: number;
  byRisk?: Record<string, number>;
  byStatus?: Record<string, number>;
  totalMembers?: number;
  avgRiskScore?: number;
  atRiskCount?: number;
  overdueCount?: number;
};

type CaseloadMember = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  riskScore: number;
  riskLevel?: string;
  lastContact?: string;
  nextCheckIn?: string | null;
  missedCheckIns: number;
  status?: string;
  supervisionState?: string;
  convictionType?: string;
  daysUntilDischarge?: number;
};

type CaseloadResponse = {
  ok: boolean;
  data?: { members: CaseloadMember[]; summary?: CaseloadSummary };
  members?: CaseloadMember[];
  summary?: CaseloadSummary;
};

function memberName(m: CaseloadMember): string {
  return m.name ?? ([m.firstName, m.lastName].filter(Boolean).join(' ') || 'Unknown');
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function avatarColor(id: string): string {
  const colors = [
    'bg-primary-100 text-primary-800',
    'bg-accent-100 text-accent-800',
    'bg-warm-100 text-warm-700',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % colors.length;
  return colors[h];
}

function riskTone(score: number): 'success' | 'warn' | 'danger' | 'neutral' {
  if (score >= 80) return 'danger';
  if (score >= 60) return 'warn';
  if (score >= 40) return 'neutral';
  return 'success';
}

function riskLabel(score: number): string {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export default function CaseloadLiveDashboard() {
  const [data, setData] = useState<CaseloadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'atRisk' | 'compliant' | 'absconded'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/po/caseload');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CaseloadResponse;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const members = data?.data?.members ?? data?.members ?? [];
  const raw = data?.data?.summary ?? data?.summary ?? {};
  const summary = {
    total: raw.totalMembers ?? raw.total ?? members.length,
    avgRisk: raw.avgRiskScore ?? raw.averageRiskScore ?? 0,
    atRisk:
      raw.atRiskCount ??
      (raw.byRisk ? (raw.byRisk.high ?? 0) + (raw.byRisk.critical ?? 0) : 0),
    overdue: raw.overdueCount ?? raw.missedCheckInsTotal ?? 0,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !memberName(m).toLowerCase().includes(q)) return false;
      if (filter === 'atRisk' && m.riskScore < 60) return false;
      if (filter === 'compliant' && (m.riskScore >= 60 || (m.missedCheckIns ?? 0) > 0)) return false;
      if (filter === 'absconded' && m.status !== 'absconded') return false;
      return true;
    });
  }, [members, query, filter]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Case Manager
            </div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl font-bold tracking-tight">
              Caseload
            </h1>
            <p className="mt-2 text-slate-600">
              {loading ? 'Loading…' : `${summary.total} active member${summary.total === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {loading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <StatCard label="Total" value={summary.total} tone="primary" />
              <StatCard label="Avg risk" value={Number(summary.avgRisk).toFixed(1)} tone="neutral" />
              <StatCard label="At risk" value={summary.atRisk} tone="warn" sub="risk score ≥ 60" />
              <StatCard label="Missed check-ins" value={summary.overdue} tone="danger" />
            </>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'atRisk', 'compliant', 'absconded'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                filter === k
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {k === 'all' ? 'All' : k === 'atRisk' ? 'At risk' : k === 'compliant' ? 'Compliant' : 'Absconded'}
            </button>
          ))}
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <div className="p-4 text-red-800">Failed to load: {error}</div>
          </Card>
        )}

        {loading && !error && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Card>
            <div className="p-8 text-center text-slate-500">
              No members match your filters.
            </div>
          </Card>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-3">
            {filtered.map((m) => {
              const name = memberName(m);
              const tone = riskTone(m.riskScore);
              return (
                <Card key={m.id} className="hover:shadow-md transition">
                  <Link href={`/caseload/${m.id}`} className="block focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-xl">
                  <div className="flex items-start gap-4 p-4 md:p-5">
                    <div
                      className={`flex h-12 w-12 flex-none items-center justify-center rounded-full text-base font-semibold ${avatarColor(m.id)}`}
                      aria-hidden="true"
                    >
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{name}</h3>
                        {m.status && (
                          <Badge tone={m.status === 'absconded' ? 'danger' : m.status === 'at_risk' ? 'warn' : 'neutral'}>
                            {m.status.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {m.supervisionState && (
                          <Badge tone="neutral">{m.supervisionState}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {m.nextCheckIn
                          ? `Next check-in ${new Date(m.nextCheckIn).toLocaleDateString()}`
                          : m.lastContact
                          ? `Last contact ${new Date(m.lastContact).toLocaleDateString()}`
                          : 'No contact scheduled'}
                        {(m.missedCheckIns ?? 0) > 0 && ` · ${m.missedCheckIns} missed`}
                        {m.convictionType && ` · ${m.convictionType}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold tracking-tight text-slate-900">{m.riskScore}</div>
                      <Badge tone={tone}>{riskLabel(m.riskScore)}</Badge>
                    </div>
                  </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
