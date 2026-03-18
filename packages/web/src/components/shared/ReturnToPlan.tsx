'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function ReturnToPlan() {
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cache = JSON.parse(localStorage.getItem('reentry-plan-cache') || '{}');
      const plans = Object.values(cache) as Array<{ id: string; cachedAt: string }>;
      if (plans.length > 0) {
        // Get the most recent plan
        const latest = plans.sort((a, b) =>
          new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime()
        )[0];
        setPlanId(latest.id);
      }
    } catch { /* no cached plans */ }
  }, []);

  if (!planId) return null;

  return (
    <Link
      href={`/plan/${planId}`}
      aria-label="Return to your action plan"
      className="fixed bottom-6 right-6 z-50 bg-accent-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-accent-700 transition-all font-semibold flex items-center gap-2 animate-slide-up"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
      Return to My Plan
    </Link>
  );
}
