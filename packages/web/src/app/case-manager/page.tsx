'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface Client {
  id: string;
  name: string;
  state: string;
  releaseDate: string;
  progress: number;
  activeRisks: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastActivity: string;
  upcomingDeadlines: number;
}

const DEMO_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'James W.',
    state: 'GA',
    releaseDate: '2026-03-01',
    progress: 45,
    activeRisks: 1,
    riskLevel: 'medium',
    lastActivity: '2 hours ago',
    upcomingDeadlines: 3,
  },
  {
    id: '2',
    name: 'Maria R.',
    state: 'GA',
    releaseDate: '2026-02-15',
    progress: 72,
    activeRisks: 0,
    riskLevel: 'low',
    lastActivity: '1 day ago',
    upcomingDeadlines: 2,
  },
  {
    id: '3',
    name: 'DeShawn T.',
    state: 'GA',
    releaseDate: '2026-03-10',
    progress: 20,
    activeRisks: 2,
    riskLevel: 'high',
    lastActivity: '5 days ago',
    upcomingDeadlines: 5,
  },
  {
    id: '4',
    name: 'Robert L.',
    state: 'TN',
    releaseDate: '2026-01-20',
    progress: 88,
    activeRisks: 0,
    riskLevel: 'low',
    lastActivity: '3 hours ago',
    upcomingDeadlines: 1,
  },
];

const RISK_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function CaseManagerDashboard() {
  const [clients] = useState<Client[]>(DEMO_CLIENTS);
  const [filter, setFilter] = useState<'all' | 'at_risk' | 'on_track'>('all');

  const filteredClients = clients.filter((c) => {
    if (filter === 'at_risk') return c.riskLevel === 'high' || c.riskLevel === 'critical';
    if (filter === 'on_track') return c.riskLevel === 'low';
    return true;
  });

  const totalClients = clients.length;
  const atRiskCount = clients.filter(
    (c) => c.riskLevel === 'high' || c.riskLevel === 'critical'
  ).length;
  const avgProgress = Math.round(
    clients.reduce((sum, c) => sum + c.progress, 0) / clients.length
  );
  const totalDeadlines = clients.reduce((sum, c) => sum + c.upcomingDeadlines, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                R
              </div>
              <span className="font-bold text-primary-950">REENTRY</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-medium text-gray-500">
              Case Manager Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm">
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Total Clients</div>
            <div className="text-3xl font-extrabold text-primary-950">
              {totalClients}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">At Risk</div>
            <div className="text-3xl font-extrabold text-red-600">
              {atRiskCount}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Avg. Progress</div>
            <div className="text-3xl font-extrabold text-accent-600">
              {avgProgress}%
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500 mb-1">Upcoming Deadlines</div>
            <div className="text-3xl font-extrabold text-warm-600">
              {totalDeadlines}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all' as const, label: 'All Clients' },
            { key: 'at_risk' as const, label: 'At Risk' },
            { key: 'on_track' as const, label: 'On Track' },
          ].map((f) => (
            <button
              key={f.key}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Client List */}
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/case-manager/${client.id}`}
              className="card flex items-center gap-6 hover:border-primary-200 transition-all"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-700 flex-shrink-0">
                {client.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-primary-950">
                    {client.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      RISK_COLORS[client.riskLevel]
                    }`}
                  >
                    {client.riskLevel}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {client.state} | Released{' '}
                  {new Date(client.releaseDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' | '}
                  Last active {client.lastActivity}
                </div>
              </div>

              {/* Progress */}
              <div className="w-32 flex-shrink-0">
                <ProgressBar
                  value={client.progress}
                  showPercentage
                  color={client.progress >= 70 ? 'accent' : 'primary'}
                />
              </div>

              {/* Alerts */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {client.activeRisks > 0 && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {client.activeRisks}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {client.upcomingDeadlines}
                </span>
              </div>

              {/* Arrow */}
              <svg
                className="w-5 h-5 text-gray-300 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
