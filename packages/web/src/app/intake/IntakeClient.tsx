'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createSession,
  advanceSession,
  type IntakeSession,
  type CollectedData,
  type IntakeState,
} from '@/lib/voice/transcript';
import { unregisterAllServiceWorkers } from '@/lib/offline/service-worker-registration';
import { Card, CardBody, CardHeader, Badge } from '@/components/ui/primitives';
import { AppShell } from '@/components/layout/AppShell';

const STATE_LABELS: Record<IntakeState, string> = {
  greeting: 'Getting started',
  name: 'Your name',
  release_date: 'Release date',
  state: 'Your state',
  release_type: 'Supervision type',
  obligations: 'Obligations',
  benefits_needed: 'Benefits needed',
  employment_goals: 'Employment goals',
  summary: 'Confirm',
  done: 'Done',
};

const STEP_ORDER: IntakeState[] = [
  'greeting',
  'name',
  'release_date',
  'state',
  'release_type',
  'obligations',
  'benefits_needed',
  'employment_goals',
  'summary',
  'done',
];

function stepIndex(state: IntakeState): number {
  const i = STEP_ORDER.indexOf(state);
  return i < 0 ? 0 : i;
}

/**
 * Voice-first intake UI. Single-question flow, large type,
 * aria-live assistant region for screen readers, progress bar.
 */
export default function IntakeClient() {
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [userInput, setUserInput] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [done, setDone] = useState(false);
  const [collected, setCollected] = useState<CollectedData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void unregisterAllServiceWorkers();
    const s = createSession(
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `intake-${Date.now()}`,
    );
    setSession(s);
    setAssistantReply(
      'Welcome to REENTRY. I will help you get your life back on track. Tell me your name.',
    );
  }, []);

  useEffect(() => {
    if (!done) inputRef.current?.focus();
  }, [assistantReply, done]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || done || !userInput.trim()) return;
    const result = advanceSession(session, userInput.trim());
    setSession(result.nextSession);
    setAssistantReply(result.assistantReply);
    setUserInput('');
    if (result.done) {
      setDone(true);
      setCollected(result.collected);
    }
  }

  const currentState = session?.currentState ?? 'greeting';
  const progress = Math.round((stepIndex(currentState) / (STEP_ORDER.length - 1)) * 100);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Intake
            </div>
            <h1 className="mt-1 font-display text-2xl md:text-3xl font-bold tracking-tight">
              Let&apos;s build your action plan
            </h1>
          </div>
          <Badge tone="primary">{STATE_LABELS[currentState]}</Badge>
        </div>

        {!done && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-2 w-full rounded-full bg-slate-200 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-primary-600 transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {done && collected ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge tone="success">Complete</Badge>
                <h2 className="font-display text-xl font-semibold">Here&apos;s what I heard</h2>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3">
                {Object.entries(collected).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex flex-col md:flex-row md:items-baseline md:gap-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 md:w-40">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </dt>
                    <dd className="text-lg text-slate-900">
                      {Array.isArray(v) ? v.join(', ') : String(v ?? '—')}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-slate-600">
                Your action plan is being prepared. You can close this page — we&apos;ll have it
                ready when you come back.
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <div
                aria-live="polite"
                className="rounded-lg bg-primary-50 border border-primary-100 px-5 py-5 text-xl leading-relaxed text-slate-900"
              >
                {assistantReply || (
                  <span className="text-slate-500">Loading…</span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <label className="block">
                  <span className="sr-only">Your answer</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    aria-label="Your answer"
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-4 text-lg placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition"
                    placeholder="Type your answer here…"
                    autoComplete="off"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-slate-900 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    aria-label="Speak your answer (coming soon)"
                    disabled
                    title="Voice input coming soon"
                    className="rounded-lg bg-slate-100 px-4 py-3.5 text-slate-400 cursor-not-allowed"
                  >
                    🎤
                  </button>
                </div>
              </form>

              <p className="mt-4 text-center text-xs text-slate-500">
                You can take your time. We won&apos;t share your answers.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
