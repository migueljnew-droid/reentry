'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, CardBody, CardHeader, Skeleton } from '@/components/ui/primitives';

type Note = {
  id: string;
  body: string;
  severity: 'info' | 'watch' | 'escalate';
  follow_up: boolean;
  created_at: string;
  author_id: string;
};

const SEVERITY_TONE: Record<Note['severity'], 'neutral' | 'warn' | 'danger'> = {
  info: 'neutral',
  watch: 'warn',
  escalate: 'danger',
};

export function MemberNotesClient({ memberId }: { memberId: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<Note['severity']>('info');
  const [followUp, setFollowUp] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`/api/po/members/${memberId}/notes`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setNotes(d.notes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setNotes([]);
    }
  }

  useEffect(() => { void load(); }, [memberId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/po/members/${memberId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), severity, follow_up: followUp }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setNotes((cur) => [d.note as Note, ...(cur ?? [])]);
      setBody('');
      setSeverity('info');
      setFollowUp(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Case notes</h2>
          <Badge tone="primary">{(notes ?? []).length} on record</Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <form onSubmit={save} className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">New note</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What happened? What's the plan?"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Severity</span>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Note['severity'])}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="info">Info</option>
                <option value="watch">Watch</option>
                <option value="escalate">Escalate</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={followUp}
                onChange={(e) => setFollowUp(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Follow-up needed
            </label>
            <button
              type="submit"
              disabled={saving || !body.trim()}
              className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
            >
              {saving ? 'Saving…' : 'Add note'}
            </button>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
        </form>

        <div className="space-y-3">
          {notes === null ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : notes.length === 0 ? (
            <p className="text-sm text-slate-500">No notes yet. Add the first one above.</p>
          ) : (
            notes.map((n) => (
              <article key={n.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone={SEVERITY_TONE[n.severity]}>{n.severity}</Badge>
                  {n.follow_up && <Badge tone="warn">Follow up</Badge>}
                  <time
                    dateTime={n.created_at}
                    className="ml-auto text-xs text-slate-500"
                    suppressHydrationWarning
                  >
                    {new Date(n.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{n.body}</p>
              </article>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
