'use client';

import { useEffect, useState } from 'react';

type CaseloadSummary = {
  totalMembers: number;
  avgRiskScore: number;
  atRiskCount: number;
  overdueCount: number;
};

type CaseloadMember = {
  id: string;
  name: string;
  riskScore: number;
  lastContact: string;
  missedCheckIns: number;
  employmentStatus?: string;
  housingStatus?: string;
};

type CaseloadResponse = {
  ok: boolean;
  members: CaseloadMember[];
  summary?: CaseloadSummary;
};

function riskColor(score: number): string {
  if (score >= 8) return 'bg-red-100 text-red-900 border-red-300';
  if (score >= 5) return 'bg-orange-100 text-orange-900 border-orange-300';
  if (score >= 3) return 'bg-yellow-100 text-yellow-900 border-yellow-300';
  return 'bg-green-100 text-green-900 border-green-300';
}

export default function CaseloadDashboard() {
  const [data, setData] = useState<CaseloadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
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
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-6 text-slate-600">Loading caseload…</div>;
  if (error) return <div className="p-6 text-red-700">Failed to load: {error}</div>;
  if (!data) return null;

  const members = data.members ?? [];
  const summary = data.summary ?? {
    totalMembers: members.length,
    avgRiskScore: 0,
    atRiskCount: 0,
    overdueCount: 0,
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Caseload Dashboard</h1>
        <p className="text-slate-600 mb-6">
          Parole / probation officer view · {summary.totalMembers} active members
        </p>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={summary.totalMembers} tone="neutral" />
          <StatCard label="Avg Risk" value={summary.avgRiskScore.toFixed(1)} tone="neutral" />
          <StatCard label="At Risk" value={summary.atRiskCount} tone="warn" />
          <StatCard label="Overdue Deadlines" value={summary.overdueCount} tone="danger" />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Members</h2>
          <div className="grid gap-3">
            {members.map((m) => (
              <article
                key={m.id}
                className={`border-l-4 p-4 rounded-lg bg-white shadow ${riskColor(m.riskScore)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{m.name}</h3>
                    <p className="text-sm text-slate-600">
                      Last contact: {new Date(m.lastContact).toLocaleDateString()} ·{' '}
                      {m.missedCheckIns} missed check-in(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{m.riskScore}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">risk</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: 'neutral' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'bg-red-50 border-red-200 text-red-900'
      : tone === 'warn'
      ? 'bg-orange-50 border-orange-200 text-orange-900'
      : 'bg-white border-slate-200 text-slate-900';
  return (
    <div className={`p-4 rounded-lg border ${toneClass}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
