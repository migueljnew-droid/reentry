'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface HousingOption {
  type: string;
  description: string;
  cost: string;
  convictionFriendly: boolean | string;
  howToFind: string[];
  restrictions?: string;
  tips?: string | string[];
}

interface StateResource {
  name: string;
  phone: string;
  website: string;
  notes: string;
}

export default function HousingPage() {
  const [options, setOptions] = useState<HousingOption[]>([]);
  const [stateResources, setStateResources] = useState<StateResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState('GA');

  useEffect(() => {
    setLoading(true);
    fetch('/api/housing/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: selectedState, convictionType: 'nonviolent_drug', needsImmediate: false }),
    })
      .then((r) => r.json())
      .then((data) => {
        setOptions(data.housingOptions || []);
        setStateResources(data.stateResources || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedState]);

  const costColor = (cost: string) => {
    if (cost.toUpperCase().includes('FREE')) return 'text-accent-600';
    return 'text-primary-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">R</div>
            <span className="font-bold text-primary-950">REENTRY</span>
          </Link>
          <span className="text-sm font-medium text-gray-500">Housing Resources</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold text-primary-950 mb-2">
          Housing for People with Records
        </h1>
        <p className="text-gray-600 mb-6">
          Finding housing with a conviction is hard — but not impossible. Here are your real options, from emergency shelter tonight to long-term housing.
        </p>

        {/* State selector */}
        <div className="flex gap-2 mb-8">
          {[
            { code: 'GA', label: 'Georgia' },
            { code: 'CA', label: 'California' },
            { code: 'TN', label: 'Tennessee' },
          ].map((s) => (
            <button
              key={s.code}
              className={`px-4 py-3 rounded-xl text-sm font-semibold min-h-[44px] transition-all cursor-pointer ${
                selectedState === s.code
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => setSelectedState(s.code)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading housing options...</div>
        ) : (
          <>
            {/* Housing types */}
            <div className="space-y-4 mb-12">
              {options.map((opt) => (
                <div
                  key={opt.type}
                  className="card cursor-pointer"
                  onClick={() => setExpandedId(expandedId === opt.type ? null : opt.type)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(expandedId === opt.type ? null : opt.type); } }}
                  aria-expanded={expandedId === opt.type}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-primary-950 mb-1">{opt.type}</h2>
                      <p className="text-sm text-gray-600">{opt.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`font-bold ${costColor(opt.cost)}`}>{opt.cost}</span>
                        {opt.convictionFriendly === true && (
                          <span className="px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                            Felon Friendly
                          </span>
                        )}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-1 ${expandedId === opt.type ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {expandedId === opt.type && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">How to Find</h3>
                        <ol className="space-y-2">
                          {opt.howToFind.map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      {opt.restrictions && (
                        <div className="bg-warm-50 p-3 rounded-lg">
                          <h3 className="text-sm font-semibold text-warm-700 mb-1">Restrictions</h3>
                          <p className="text-sm text-warm-600">{opt.restrictions}</p>
                        </div>
                      )}
                      {opt.tips && (
                        <div className="bg-primary-50 p-3 rounded-lg">
                          <h3 className="text-sm font-semibold text-primary-700 mb-1">Tips</h3>
                          {Array.isArray(opt.tips) ? (
                            <ul className="list-disc list-inside text-sm text-primary-600 space-y-1">
                              {opt.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                          ) : (
                            <p className="text-sm text-primary-600">{opt.tips}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* State-specific resources */}
            {stateResources.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-extrabold text-primary-950 mb-4">
                  Local Resources
                </h2>
                <div className="space-y-3">
                  {stateResources.map((res) => (
                    <div key={res.name} className="card">
                      <h3 className="font-bold text-primary-950">{res.name}</h3>
                      <a
                        href={`tel:${res.phone}`}
                        className="text-lg font-bold text-primary-600 hover:text-primary-700 block mt-1"
                      >
                        {res.phone}
                      </a>
                      {res.website && (
                        <a
                          href={`https://${res.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-500 hover:underline"
                        >
                          {res.website}
                        </a>
                      )}
                      <p className="text-sm text-gray-600 mt-2">{res.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-center">
          <Link href="/intake">
            <Button size="lg">Get My Personalized Housing Plan</Button>
          </Link>
          <p className="text-sm text-gray-400 mt-3">
            Complete the intake to get housing matched to YOUR situation and location.
          </p>
        </div>
      </main>
    </div>
  );
}
