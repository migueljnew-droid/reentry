'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AdSlot } from '@/components/shared/AdSlot';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface DashboardDeadline {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  daysUntil: number;
  urgent: boolean;
}

const DEMO_DEADLINES: DashboardDeadline[] = [
  {
    id: '1',
    title: 'Parole check-in with Officer Davis',
    dueDate: '2026-03-24',
    category: 'supervision',
    daysUntil: 7,
    urgent: false,
  },
  {
    id: '2',
    title: 'Pick up Social Security card (should be ready)',
    dueDate: '2026-03-31',
    category: 'id',
    daysUntil: 14,
    urgent: false,
  },
  {
    id: '3',
    title: 'SNAP recertification — bring updated income proof',
    dueDate: '2026-04-15',
    category: 'benefits',
    daysUntil: 29,
    urgent: false,
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  id: '🪪',
  benefits: '💰',
  housing: '🏠',
  employment: '💼',
  legal: '⚖️',
  supervision: '📋',
  healthcare: '🏥',
  education: '📚',
};

export default function DashboardPage() {
  const [deadlines] = useState(DEMO_DEADLINES);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50" role="banner">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="REENTRY home">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
              R
            </div>
            <span className="font-bold text-primary-950">REENTRY</span>
          </Link>
          <Link href="/plan/demo">
            <Button variant="secondary" size="sm">
              View Full Plan
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-primary-950 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Here&apos;s where you stand on your reentry plan.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="card-elevated mb-6">
          <h2 className="text-lg font-bold text-primary-950 mb-4">
            Your Progress
          </h2>
          <ProgressBar value={35} label="Overall completion" color="accent" />
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-accent-600">5</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-primary-600">3</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-extrabold text-gray-400">6</div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
          </div>
        </div>

        {/* Category Progress */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-primary-950 mb-4">
            By Category
          </h2>
          <div className="space-y-4">
            {[
              { cat: 'id', label: 'Identification', progress: 66 },
              { cat: 'benefits', label: 'Benefits', progress: 40 },
              { cat: 'housing', label: 'Housing', progress: 20 },
              { cat: 'employment', label: 'Employment', progress: 10 },
              { cat: 'supervision', label: 'Supervision', progress: 50 },
              { cat: 'healthcare', label: 'Healthcare', progress: 80 },
            ].map((item) => (
              <div key={item.cat} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">
                  {CATEGORY_ICONS[item.cat]}
                </span>
                <div className="flex-1">
                  <ProgressBar
                    value={item.progress}
                    label={item.label}
                    color={item.progress >= 70 ? 'accent' : 'primary'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-primary-950 mb-4">
            Upcoming Deadlines
          </h2>
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`flex items-start gap-4 p-4 rounded-xl ${
                  deadline.daysUntil <= 3
                    ? 'bg-red-50 border border-red-100'
                    : deadline.daysUntil <= 7
                    ? 'bg-yellow-50 border border-yellow-100'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <span className="text-xl">
                  {CATEGORY_ICONS[deadline.category] || '📅'}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-primary-950">
                    {deadline.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(deadline.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    deadline.daysUntil <= 3
                      ? 'bg-red-100 text-red-700'
                      : deadline.daysUntil <= 7
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {deadline.daysUntil === 0
                    ? 'TODAY'
                    : deadline.daysUntil === 1
                    ? 'Tomorrow'
                    : `${deadline.daysUntil} days`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad — dashboard */}
        <div className="mb-6">
          <AdSlot slot="dashboard-mid" format="rectangle" />
        </div>

        {/* Quick Actions */}
        <nav aria-label="Quick actions" className="grid grid-cols-2 gap-3">
          <Link href="/plan/demo" className="card text-center hover:border-primary-300">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold text-primary-950">View Plan</div>
            <div className="text-xs text-gray-500">Full action plan</div>
          </Link>
          <Link href="/intake" className="card text-center hover:border-primary-300">
            <div className="text-2xl mb-2" aria-hidden="true">🔄</div>
            <div className="font-semibold text-primary-950">Update Info</div>
            <div className="text-xs text-gray-500">Changed situation</div>
          </Link>
        </nav>
      </main>
    </div>
  );
}
