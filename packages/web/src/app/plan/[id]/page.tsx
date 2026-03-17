'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

interface DemoStep {
  id: string;
  title: string;
  category: string;
  icon: string;
  status: StepStatus;
  instructions: string[];
  deadline: string;
}

interface DemoPhase {
  id: string;
  label: string;
  description: string;
  color: string;
  steps: DemoStep[];
}

interface DemoPlan {
  id: string;
  userName: string;
  state: string;
  stateName: string;
  generatedAt: string;
  progress: { total: number; completed: number; percent: number };
  phases: DemoPhase[];
}

function mapParsedPlan(parsed: Record<string, unknown>): DemoPlan {
  return {
    ...DEMO_PLAN,
    id: (parsed.id as string) || DEMO_PLAN.id,
    userName: (parsed.userName as string) || DEMO_PLAN.userName,
    state: (parsed.state as string) || DEMO_PLAN.state,
    stateName: (parsed.stateName as string) || DEMO_PLAN.stateName,
    generatedAt: (parsed.generatedAt as string) || DEMO_PLAN.generatedAt,
    phases: (parsed.phases as DemoPhase[])?.map((phase: DemoPhase) => ({
      ...phase,
      steps: phase.steps?.map((step: DemoStep) => ({
        ...step,
        icon: getCategoryIcon(step.category),
        status: step.status || 'pending',
      })) || [],
    })) || DEMO_PLAN.phases,
  };
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    id: '🪪',
    benefits: '💰',
    housing: '🏠',
    employment: '💼',
    legal: '⚖️',
    supervision: '📋',
    healthcare: '🏥',
    education: '📚',
    family: '👨‍👩‍👧‍👦',
    phone: '📱',
    food: '🍽️',
    financial: '🏦',
  };
  return icons[category] || '📌';
}

// Demo data — in production this comes from the API
const DEMO_PLAN: DemoPlan = {
  id: 'demo-plan-001',
  userName: 'Demo User',
  state: 'GA',
  stateName: 'Georgia',
  generatedAt: new Date().toISOString(),
  progress: { total: 18, completed: 0, percent: 0 },
  phases: [
    {
      id: 'immediate',
      label: 'First 72 Hours',
      description: 'Emergency needs — do these TODAY',
      color: 'bg-red-500',
      steps: [
        {
          id: 's1',
          title: 'Find emergency shelter',
          category: 'housing',
          icon: '🏠',
          status: 'pending',
          instructions: [
            'Call Atlanta Mission at 404-367-2493',
            "The Shepherd's Inn (men): 165 Alexander St NW, Atlanta",
            "My Sister's House (women): 921 Howell Mill Rd NW",
            'Bring your release paperwork — they need it for intake',
          ],
          deadline: 'Today',
        },
        {
          id: 's2',
          title: 'Get free phone (Lifeline)',
          category: 'phone',
          icon: '📱',
          status: 'pending',
          instructions: [
            'Apply online: lifelinesupport.org',
            'Or visit any SafeLink Wireless location',
            'Bring proof of income or SNAP enrollment',
            'Free smartphone + unlimited talk/text + data',
          ],
          deadline: 'Within 3 days',
        },
        {
          id: 's3',
          title: 'Emergency food assistance',
          category: 'food',
          icon: '🍽️',
          status: 'pending',
          instructions: [
            'Apply for SNAP expedited processing (same day possible)',
            'Call Georgia DFCS: 877-423-4746',
            'Visit Atlanta Community Food Bank: 732 Joseph E. Lowery Blvd NW',
            'No ID required for food bank — just show up',
          ],
          deadline: 'Today',
        },
      ],
    },
    {
      id: 'week_1',
      label: 'Week 1',
      description: 'ID, healthcare, and getting settled',
      color: 'bg-orange-500',
      steps: [
        {
          id: 's4',
          title: 'Replace your Social Security card',
          category: 'id',
          icon: '🪪',
          status: 'pending',
          instructions: [
            'Visit your local SSA office (no appointment needed)',
            'Find nearest office: ssa.gov/locator',
            'Bring: release documentation + any photo ID',
            'If no photo ID: bring 2 forms of secondary ID (birth certificate, medical records)',
            'Cost: FREE | Processing: ~14 days',
          ],
          deadline: 'This week',
        },
        {
          id: 's5',
          title: 'Apply for Georgia Medicaid',
          category: 'healthcare',
          icon: '🏥',
          status: 'pending',
          instructions: [
            'Apply online at gateway.ga.gov',
            'Or call: 877-423-4746',
            'Georgia expanded Medicaid in 2024 — most returning citizens qualify',
            'Bring: proof of identity, income, Georgia residency',
            'Processing: up to 45 days (but coverage backdates)',
          ],
          deadline: 'This week',
        },
        {
          id: 's6',
          title: 'Parole/Probation check-in',
          category: 'supervision',
          icon: '📋',
          status: 'pending',
          instructions: [
            'Report to your assigned parole officer within 72 hours of release',
            'Bring: release documents, proof of address (shelter letter counts)',
            'Get your check-in schedule in writing',
            'Ask about travel restrictions and any special conditions',
          ],
          deadline: 'Within 72 hours',
        },
        {
          id: 's7',
          title: 'Open a bank account',
          category: 'financial',
          icon: '🏦',
          status: 'pending',
          instructions: [
            'Second-chance banks: Chime, Current, or local credit union',
            'No credit check required for Chime',
            'Need: photo ID (state ID or release docs) + SSN',
            'Tip: Ask parole officer for a letter confirming identity if you have no ID yet',
          ],
          deadline: 'This week',
        },
      ],
    },
    {
      id: 'month_1',
      label: 'Month 1',
      description: 'Benefits, employment, and building stability',
      color: 'bg-blue-500',
      steps: [
        {
          id: 's8',
          title: 'Get Georgia State ID',
          category: 'id',
          icon: '🪪',
          status: 'pending',
          instructions: [
            'Visit any Georgia DDS Customer Service Center',
            'Find nearest: dds.georgia.gov/locations',
            'Bring: birth certificate + Social Security card + proof of address',
            'No birth certificate? Order from dph.georgia.gov ($25, ~15 days)',
            'Proof of address: shelter letter or parole officer letter accepted',
            'Cost: $32 (fee waiver available — ask about indigence exemption)',
            'Tip: Go early in the morning — expect 1-2 hour wait',
          ],
          deadline: 'Within 30 days',
        },
        {
          id: 's9',
          title: 'Apply for SNAP (Food Stamps)',
          category: 'benefits',
          icon: '💰',
          status: 'pending',
          instructions: [
            'Apply online: gateway.ga.gov',
            'Or call DFCS: 877-423-4746',
            'You may qualify for expedited SNAP (same-day if income < $150)',
            'Benefits: $234-$1,751/month depending on household size',
            'Bring: ID, proof of income, proof of address, SSN',
          ],
          deadline: 'Within 30 days',
        },
        {
          id: 's10',
          title: 'Job search — conviction-friendly employers',
          category: 'employment',
          icon: '💼',
          status: 'pending',
          instructions: [
            'Visit Goodwill of North Georgia: 404-420-9900 (free job coaching)',
            'Register at Georgia WorkSource center (workforce.georgia.gov)',
            'Major employers that hire with records: Walmart, Amazon, FedEx, UPS, construction companies',
            'Tip: Apply in person when possible — it shows initiative',
            'Avoid mentioning conviction unless directly asked (Atlanta has Fair Chance Ordinance)',
          ],
          deadline: 'Month 1',
        },
        {
          id: 's11',
          title: 'Housing search',
          category: 'housing',
          icon: '🏠',
          status: 'pending',
          instructions: [
            'Apply for transitional housing through DCS reentry services',
            'Call Georgia DCS Reentry: 404-651-6727',
            'For Section 8: apply at your local housing authority (long waitlist)',
            'Look for landlords who accept applicants with records',
            'Tip: Get a reference letter from your parole officer',
          ],
          deadline: 'Month 1',
        },
      ],
    },
    {
      id: 'ongoing',
      label: 'Months 2-12',
      description: 'Long-term stability and growth',
      color: 'bg-green-500',
      steps: [
        {
          id: 's12',
          title: 'Maintain parole compliance',
          category: 'supervision',
          icon: '📋',
          status: 'pending',
          instructions: [
            'Never miss a check-in — set reminders',
            'Keep your parole officer updated on address changes',
            'Complete all required programs (substance abuse, anger management)',
            'Random drug tests — be prepared at all times',
            'Good behavior can reduce check-in frequency after 12 months',
          ],
          deadline: 'Ongoing',
        },
        {
          id: 's13',
          title: 'Check record expungement eligibility',
          category: 'legal',
          icon: '⚖️',
          status: 'pending',
          instructions: [
            'Georgia allows restriction (sealing) of some records after completion of sentence',
            'Contact Georgia Legal Services: 404-206-5175 (free)',
            'First offender records can be sealed after sentence completion',
            'Some drug offenses eligible for conditional discharge expungement',
            'Waiting period varies by offense type',
          ],
          deadline: 'After sentence completion',
        },
        {
          id: 's14',
          title: 'Apply for Pell Grant (education)',
          category: 'education',
          icon: '📚',
          status: 'pending',
          instructions: [
            'Apply at studentaid.gov (FAFSA)',
            'As of 2024, ALL returning citizens are eligible (law changed)',
            'Up to $7,395/year for college or vocational training',
            'Georgia has excellent technical colleges (Quick Start program)',
            'Tip: Skilled trades (HVAC, welding, electrical) have highest employment rates',
          ],
          deadline: 'When ready',
        },
      ],
    },
  ],
};

export default function PlanPage() {
  const [isOffline, setIsOffline] = useState(false);
  const [plan, setPlan] = useState<DemoPlan>(() => {
    if (typeof window === 'undefined') return DEMO_PLAN;

    // 1. Try sessionStorage (just generated from intake)
    const session = sessionStorage.getItem('reentry-plan');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Also save to localStorage for offline access
        const cache = JSON.parse(localStorage.getItem('reentry-plan-cache') || '{}');
        cache[parsed.id] = { id: parsed.id, data: parsed, cachedAt: new Date().toISOString() };
        localStorage.setItem('reentry-plan-cache', JSON.stringify(cache));

        return mapParsedPlan(parsed);
      } catch { /* fall through */ }
    }

    // 2. Try localStorage (offline cache)
    try {
      const cache = JSON.parse(localStorage.getItem('reentry-plan-cache') || '{}');
      const plans = Object.values(cache) as Array<{ data: Record<string, unknown> }>;
      if (plans.length > 0) {
        setIsOffline(!navigator.onLine);
        return mapParsedPlan(plans[plans.length - 1].data);
      }
    } catch { /* fall through */ }

    // 3. Demo data
    return DEMO_PLAN;
  });
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const completedCount = plan.phases.reduce(
    (acc, phase) => acc + phase.steps.filter((s) => s.status === 'completed').length,
    0
  );
  const totalCount = plan.phases.reduce((acc, phase) => acc + phase.steps.length, 0);

  const toggleStep = (stepId: string) => {
    setPlan((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) => ({
        ...phase,
        steps: phase.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                status: step.status === 'completed' ? 'pending' as StepStatus : 'completed' as StepStatus,
              }
            : step
        ),
      })),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-warm-500 text-white text-center py-2 text-sm font-medium">
          📴 You&apos;re offline — viewing your saved plan
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                R
              </div>
              <span className="font-bold text-primary-950">REENTRY</span>
            </Link>
            <Button variant="secondary" size="sm">
              Print Plan
            </Button>
          </div>
          <ProgressBar
            value={completedCount}
            max={totalCount}
            label={`${completedCount} of ${totalCount} steps completed`}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Plan header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-primary-950 mb-2">
            Your Reentry Action Plan
          </h1>
          <p className="text-gray-600">
            {plan.stateName} | Generated{' '}
            {new Date(plan.generatedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Phases */}
        <div className="space-y-8">
          {plan.phases.map((phase) => {
            const phaseCompleted = phase.steps.filter(
              (s) => s.status === 'completed'
            ).length;

            return (
              <section key={phase.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                  <h2 className="text-xl font-bold text-primary-950">
                    {phase.label}
                  </h2>
                  <span className="text-sm text-gray-400">
                    {phaseCompleted}/{phase.steps.length}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4 ml-6">
                  {phase.description}
                </p>

                <div className="space-y-3 ml-6">
                  {phase.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`card cursor-pointer transition-all ${
                        step.status === 'completed'
                          ? 'bg-accent-50 border-accent-200'
                          : ''
                      }`}
                    >
                      <div
                        className="flex items-start gap-4"
                        onClick={() =>
                          setExpandedStep(
                            expandedStep === step.id ? null : step.id
                          )
                        }
                      >
                        <button
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            step.status === 'completed'
                              ? 'bg-accent-500 border-accent-500 text-white'
                              : 'border-gray-300 hover:border-primary-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStep(step.id);
                          }}
                          aria-label={
                            step.status === 'completed'
                              ? 'Mark as incomplete'
                              : 'Mark as complete'
                          }
                        >
                          {step.status === 'completed' && (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{step.icon}</span>
                            <h3
                              className={`font-semibold ${
                                step.status === 'completed'
                                  ? 'text-gray-400 line-through'
                                  : 'text-primary-950'
                              }`}
                            >
                              {step.title}
                            </h3>
                          </div>
                          {step.deadline && (
                            <span className="text-xs text-gray-400 mt-1 block">
                              {step.deadline}
                            </span>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedStep === step.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {expandedStep === step.id && (
                        <div className="mt-4 ml-11 border-t border-gray-100 pt-4">
                          <ol className="space-y-3">
                            {step.instructions.map((instruction, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-3 text-gray-700"
                              >
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="leading-relaxed">
                                  {instruction}
                                </span>
                              </li>
                            ))}
                          </ol>
                          <div className="mt-4 flex gap-3">
                            <Button
                              variant={
                                step.status === 'completed'
                                  ? 'ghost'
                                  : 'accent'
                              }
                              size="sm"
                              onClick={() => toggleStep(step.id)}
                            >
                              {step.status === 'completed'
                                ? 'Undo'
                                : 'Mark Complete'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
