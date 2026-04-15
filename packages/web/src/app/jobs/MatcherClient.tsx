'use client';

import { useState } from 'react';

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

const CONVICTION_OPTIONS = [
  { value: 'nonviolent', label: 'Non-violent' },
  { value: 'drug', label: 'Drug offense' },
  { value: 'violent', label: 'Violent offense' },
  { value: 'sex_offense', label: 'Sex offense' },
  { value: 'traffic', label: 'Traffic / DUI' },
  { value: 'other', label: 'Other' },
];

const US_STATES = ['GA', 'CA', 'TX', 'FL', 'NY', 'IL', 'TN', 'OH', 'PA', 'MI', 'NC', 'VA'];

export default function MatcherClient() {
  const [state, setState] = useState('GA');
  const [convictionType, setConvictionType] = useState('nonviolent');
  const [remoteOk, setRemoteOk] = useState(false);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
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
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Find Fair-Chance Employers</h1>
        <p className="text-slate-600 mb-6">
          Employers who hire returning citizens, ranked by your fit.
        </p>

        <form onSubmit={search} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">State</span>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-1 w-full p-3 rounded border-slate-300 border text-lg"
              >
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Conviction type</span>
              <select
                value={convictionType}
                onChange={(e) => setConvictionType(e.target.value)}
                className="mt-1 w-full p-3 rounded border-slate-300 border text-lg"
              >
                {CONVICTION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={remoteOk}
              onChange={(e) => setRemoteOk(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-lg">I can work remotely</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-lg font-semibold py-3 rounded-lg"
          >
            {loading ? 'Searching…' : 'Find employers'}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-900 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {data && (
          <section>
            <h2 className="text-xl font-semibold mb-3">
              {data.totalFound} employer(s) found
            </h2>
            {data.banTheBoxProtection?.summary && (
              <div className="p-4 mb-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 text-sm">
                <strong>Ban-the-Box protection in your state:</strong>{' '}
                {data.banTheBoxProtection.summary}
              </div>
            )}
            <div className="grid gap-3">
              {data.matches.map((m) => (
                <article
                  key={m.id}
                  className={`p-4 rounded-lg shadow border-l-4 ${
                    m.restricted
                      ? 'bg-orange-50 border-orange-400'
                      : 'bg-white border-green-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {m.name}
                        {m.restricted && (
                          <span className="ml-2 text-xs bg-orange-200 text-orange-900 px-2 py-0.5 rounded">
                            may not hire you
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {m.industry} · {m.state} ·{' '}
                        {m.remoteOk ? 'Remote OK' : 'On-site'} · {m.convictionPolicy}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-700">{m.matchScore}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-500">fit</div>
                    </div>
                  </div>
                  <p className="text-slate-700 mt-2">{m.explanation}</p>
                  {m.tips.length > 0 && (
                    <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
                      {m.tips.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  )}
                  {m.hiringUrl && (
                    <a
                      href={m.hiringUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-blue-700 hover:underline text-sm font-semibold"
                    >
                      Visit hiring page →
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
