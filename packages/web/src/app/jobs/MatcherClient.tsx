'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge, Card, CardBody, Hero, Skeleton } from '@/components/ui/primitives';

type MatchResult = {
  id: string;
  name: string;
  industry: string;
  state: string;
  convictionPolicy: string;
  remoteOk: boolean;
  hiringUrl?: string;
  score: number;
  matchScore: number;
  restricted: boolean;
  explanation: string;
  tips: string[];
};

type MatchResponse = {
  ok: boolean;
  totalFound: number;
  voiceSummary?: string;
  banTheBoxProtection?: { summary?: string };
  matches: MatchResult[];
};

const CONVICTIONS = [
  { value: 'nonviolent', label: 'Non-violent' },
  { value: 'drug', label: 'Drug offense' },
  { value: 'violent', label: 'Violent offense' },
  { value: 'sex_offense', label: 'Sex offense' },
  { value: 'traffic', label: 'Traffic / DUI' },
  { value: 'other', label: 'Other' },
];

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

function logoTone(name: string): string {
  const palettes = [
    'bg-primary-100 text-primary-800',
    'bg-accent-100 text-accent-800',
    'bg-warm-100 text-warm-700',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
    'bg-pink-100 text-pink-800',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % palettes.length;
  return palettes[h];
}

function initials(name: string): string {
  return name
    .split(/[^\w]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '??';
}

export default function MatcherClient() {
  const [state, setState] = useState('GA');
  const [convictionType, setConvictionType] = useState('nonviolent');
  const [remoteOk, setRemoteOk] = useState(false);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/employment/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, convictionType, remoteOk }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <Hero
        title={<>Find fair-chance employers</>}
        subtitle={
          <>
            Employers who hire returning citizens, ranked by your fit. Ban-the-box
            protections for your state surfaced inline.
          </>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
        <Card>
          <CardBody>
            <form onSubmit={search} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">State</span>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Conviction type</span>
                  <select
                    value={convictionType}
                    onChange={(e) => setConvictionType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {CONVICTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={remoteOk}
                  onChange={(e) => setRemoteOk(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                I can work remotely
              </label>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
              >
                {loading ? 'Searching…' : 'Find employers'}
              </button>
            </form>
          </CardBody>
        </Card>

        {error && (
          <Card className="mt-5 border-red-200 bg-red-50">
            <div className="p-4 text-red-800">{error}</div>
          </Card>
        )}

        {loading && (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        )}

        {data && !loading && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display text-xl font-semibold text-slate-900">
                {data.totalFound} employer{data.totalFound === 1 ? '' : 's'} found
              </h2>
            </div>

            {data.banTheBoxProtection?.summary && (
              <Card className="mb-4 border-primary-200 bg-primary-50">
                <div className="px-4 py-3 text-sm text-primary-900">
                  <strong className="font-semibold">Ban-the-Box protection in {state}:</strong>{' '}
                  {data.banTheBoxProtection.summary}
                </div>
              </Card>
            )}

            {data.voiceSummary && (
              <p className="mb-5 text-slate-600 leading-relaxed">{data.voiceSummary}</p>
            )}

            <div className="grid gap-3">
              {data.matches.map((m) => (
                <Card key={m.id} className="hover:shadow-md transition">
                  <div className="flex items-start gap-4 p-4 md:p-5">
                    <div
                      className={`flex h-12 w-12 flex-none items-center justify-center rounded-lg text-sm font-bold ${logoTone(m.name)}`}
                      aria-hidden="true"
                    >
                      {initials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{m.name}</h3>
                        {m.restricted ? (
                          <Badge tone="warn">May not hire you</Badge>
                        ) : (
                          <Badge tone="success">Fair chance</Badge>
                        )}
                        {m.remoteOk && <Badge tone="primary">Remote OK</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {m.industry} · {m.state} · {m.convictionPolicy}
                      </p>
                      <p className="mt-2 text-sm text-slate-700 leading-relaxed">{m.explanation}</p>
                      {m.tips.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc list-inside">
                          {m.tips.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      )}
                      {m.hiringUrl && (
                        <a
                          href={m.hiringUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900"
                        >
                          Visit hiring page <span aria-hidden="true">→</span>
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col items-end flex-none">
                      <div className="text-2xl font-bold tracking-tight text-slate-900">{m.matchScore}</div>
                      <div className="text-xs uppercase tracking-wider text-slate-500">fit</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
