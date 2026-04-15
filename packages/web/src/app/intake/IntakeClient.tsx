'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createSession,
  advanceSession,
  type IntakeSession,
  type CollectedData,
} from '@/lib/voice/transcript';
import { unregisterAllServiceWorkers } from '@/lib/offline/service-worker-registration';

/**
 * Voice-first intake UI for digital-newcomer users.
 *
 * Large fonts, single-question flow, aria-live for assistant output.
 * FSM lives in @/lib/voice/transcript — this component just renders
 * the current assistant prompt and collects one user utterance at a time.
 */
export default function IntakeClient() {
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [userInput, setUserInput] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [done, setDone] = useState(false);
  const [collected, setCollected] = useState<CollectedData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session init on mount.
  useEffect(() => {
    // Nuke any stale SW from prior sessions — it intercepts navigations
    // and serves pre-hydration HTML, leaving the assistant reply blank.
    void unregisterAllServiceWorkers();

    const s = createSession(
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `intake-${Date.now()}`,
    );
    setSession(s);
    const greeting =
      'Welcome to REENTRY. I will help you get your life back on track. Tell me your name.';
    setAssistantReply(greeting);
  }, []);

  // Keep focus on the input between turns.
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

  if (done && collected) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Thank you. Here is what I heard.</h1>
          <dl className="text-xl space-y-3">
            {Object.entries(collected).map(([k, v]) => (
              <div key={k} className="bg-white p-4 rounded-lg shadow">
                <dt className="text-sm text-slate-500 uppercase tracking-wide">{k}</dt>
                <dd className="text-xl mt-1">{String(v ?? '—')}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-lg text-slate-600">
            Your action plan is being prepared. You can close this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">REENTRY Navigator</h1>

        <div
          aria-live="polite"
          className="bg-white p-6 rounded-lg shadow mb-6 text-2xl leading-relaxed"
        >
          {assistantReply}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="sr-only">Your answer</span>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              aria-label="Your answer"
              className="w-full p-4 text-xl rounded-lg border-2 border-slate-300 focus:border-blue-500 focus:outline-none"
              placeholder="Type your answer here..."
              autoComplete="off"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-4 rounded-lg"
            >
              Next
            </button>
            {/* TODO(voice-intake): wire Whisper STT + TTS for digital-newcomer flow */}
            <button
              type="button"
              aria-label="Speak your answer (coming soon)"
              disabled
              className="px-6 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed"
            >
              🎤
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
