'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface Employer {
  name: string;
  industry: string;
  positions: string[];
  payRange: string;
  convictionPolicy: string;
  restrictions: string[];
  banTheBox: boolean;
  applyUrl: string;
  locations: string;
  benefits: string;
  notes: string;
  matchScore?: number;
  restricted?: boolean;
  restrictionNote?: string | null;
}

export default function JobsPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/employment/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'GA', convictionType: 'nonviolent_drug' }),
    })
      .then((r) => r.json())
      .then((data) => {
        setEmployers(data.matches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">R</div>
            <span className="font-bold text-primary-950">REENTRY</span>
          </Link>
          <span className="text-sm font-medium text-gray-500">Jobs That Hire You</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold text-primary-950 mb-2">
          Employers Who Hire People with Records
        </h1>
        <p className="text-gray-600 mb-8">
          These companies have Ban the Box policies and actively hire returning citizens.
          Tap any employer to see details, pay, and how to apply.
        </p>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading employers...</div>
        ) : (
          <div className="space-y-4">
            {employers.map((emp) => (
              <div
                key={emp.name}
                className={`card cursor-pointer ${emp.restricted ? 'opacity-60' : ''}`}
                onClick={() => setExpandedId(expandedId === emp.name ? null : emp.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === emp.name ? null : emp.name); } }}
                aria-expanded={expandedId === emp.name}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-primary-950">{emp.name}</h2>
                      {emp.banTheBox && (
                        <span className="px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                          Ban the Box
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{emp.industry}</p>
                    <p className="text-lg font-bold text-accent-600 mt-1">{emp.payRange}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === emp.name ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {expandedId === emp.name && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Positions</h3>
                      <p className="text-gray-800">{emp.positions.join(', ')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Conviction Policy</h3>
                      <p className="text-gray-800">{emp.convictionPolicy}</p>
                    </div>
                    {emp.restrictions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Restrictions</h3>
                        <ul className="list-disc list-inside text-gray-700">
                          {emp.restrictions.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Benefits</h3>
                      <p className="text-gray-800">{emp.benefits}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-1">Locations</h3>
                      <p className="text-gray-800">{emp.locations}</p>
                    </div>
                    {emp.notes && (
                      <div className="bg-primary-50 p-3 rounded-lg">
                        <p className="text-sm text-primary-800">{emp.notes}</p>
                      </div>
                    )}
                    <a
                      href={emp.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-accent inline-block text-center w-full"
                    >
                      Apply Now
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/intake">
            <Button size="lg">Get My Personalized Job Matches</Button>
          </Link>
          <p className="text-sm text-gray-400 mt-3">
            Complete the intake to get jobs matched to YOUR skills, location, and situation.
          </p>
        </div>
      </main>
    </div>
  );
}
