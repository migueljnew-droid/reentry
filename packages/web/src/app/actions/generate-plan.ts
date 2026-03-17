'use server';

import { US_STATES } from '@reentry/shared';

interface IntakeData {
  fullName: string;
  state: string;
  convictionType: string;
  releaseDate: string;
  immediateNeeds: string[];
  hasChildren: boolean;
  numberOfChildren: number;
  hasSupportNetwork: boolean;
  workHistory: string;
  education: string;
  supervisionType: string;
  checkInFrequency: string;
}

interface PlanStep {
  id: string;
  phase: string;
  category: string;
  title: string;
  description: string;
  instructions: string[];
  documentsNeeded: string[];
  deadline: string;
  priority: number;
}

interface GeneratedPlan {
  id: string;
  userName: string;
  state: string;
  stateName: string;
  generatedAt: string;
  phases: {
    id: string;
    label: string;
    description: string;
    color: string;
    steps: PlanStep[];
  }[];
}

export async function generateReentryPlan(
  intake: IntakeData
): Promise<GeneratedPlan> {
  // Load state-specific requirements
  const stateData = await loadStateRequirements(intake.state);

  // Build the plan based on intake data + state requirements
  const plan = buildPlan(intake, stateData);

  return plan;
}

async function loadStateRequirements(
  state: string
): Promise<Record<string, unknown>> {
  try {
    // In production: load from Supabase or API
    // For now: load from local data files
    const fs = await import('fs/promises');
    const path = await import('path');

    let dataPath: string;
    if (state === 'FED') {
      dataPath = path.join(process.cwd(), '..', '..', 'data', 'federal', 'requirements.json');
    } else {
      dataPath = path.join(process.cwd(), '..', '..', 'data', 'states', state, 'requirements.json');
    }

    const raw = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function buildPlan(
  intake: IntakeData,
  stateData: Record<string, unknown>
): GeneratedPlan {
  const planId = crypto.randomUUID();
  const stateName = US_STATES[intake.state] || intake.state;

  const steps: PlanStep[] = [];
  let stepCounter = 0;

  const nextId = () => {
    stepCounter++;
    return `step-${stepCounter}`;
  };

  // ========== IMMEDIATE (First 72 Hours) ==========
  const immediateSteps: PlanStep[] = [];

  if (intake.immediateNeeds.includes('shelter')) {
    const resources = (stateData as Record<string, Record<string, unknown>>)?.resources as Record<string, unknown[]> | undefined;
    const shelters = resources?.emergencyShelters as Array<{ name: string; phone: string; address?: string }> | undefined;

    immediateSteps.push({
      id: nextId(),
      phase: 'immediate',
      category: 'housing',
      title: 'Find emergency shelter',
      description: 'Get a safe place to stay tonight.',
      instructions: shelters
        ? shelters.map((s) => `${s.name}: ${s.phone}${s.address ? ` — ${s.address}` : ''}`)
        : [
            'Call 211 for local shelter referrals',
            'Visit your nearest Salvation Army or community center',
            'Ask your parole officer for emergency housing referrals',
          ],
      documentsNeeded: ['Release paperwork'],
      deadline: 'Today',
      priority: 1,
    });
  }

  if (intake.immediateNeeds.includes('food')) {
    immediateSteps.push({
      id: nextId(),
      phase: 'immediate',
      category: 'benefits',
      title: 'Get food assistance',
      description: 'Emergency food resources available today.',
      instructions: [
        'Apply for expedited SNAP benefits — call your state agency',
        'Visit your nearest food bank (no ID required at most locations)',
        'Call 211 for food pantry locations near you',
        'Many churches offer free meals — call 211 for schedule',
      ],
      documentsNeeded: [],
      deadline: 'Today',
      priority: 1,
    });
  }

  if (intake.immediateNeeds.includes('phone')) {
    immediateSteps.push({
      id: nextId(),
      phase: 'immediate',
      category: 'benefits',
      title: 'Get a free phone (Lifeline program)',
      description: 'Free smartphone with talk, text, and data.',
      instructions: [
        'Apply at lifelinesupport.org',
        'Or visit any SafeLink Wireless / Assurance Wireless location',
        'Bring: proof of income or enrollment in SNAP/Medicaid/SSI',
        'Free smartphone + unlimited talk/text + data included',
      ],
      documentsNeeded: ['Proof of income or public assistance enrollment'],
      deadline: 'Within 3 days',
      priority: 2,
    });
  }

  if (intake.immediateNeeds.includes('transportation')) {
    immediateSteps.push({
      id: nextId(),
      phase: 'immediate',
      category: 'housing',
      title: 'Get transportation',
      description: 'Transit passes and ride assistance.',
      instructions: [
        'Ask your parole officer about transit pass programs',
        'Many reentry organizations provide bus passes',
        'Call 211 for transportation assistance in your area',
        'Some states offer free transit for returning citizens — ask your case worker',
      ],
      documentsNeeded: ['Release paperwork'],
      deadline: 'Today',
      priority: 2,
    });
  }

  // Always add parole/probation check-in if supervised
  if (intake.supervisionType && intake.supervisionType !== 'none') {
    immediateSteps.push({
      id: nextId(),
      phase: 'immediate',
      category: 'supervision',
      title: `Report to your ${intake.supervisionType} officer`,
      description: 'Required within 72 hours of release in most states.',
      instructions: [
        `Report to your assigned ${intake.supervisionType} officer within 72 hours`,
        'Bring: release documents, proof of address (shelter letter counts)',
        'Get your check-in schedule IN WRITING',
        'Ask about travel restrictions and any special conditions',
        'Get your officer\'s direct phone number and email',
      ],
      documentsNeeded: ['Release documents', 'Proof of address'],
      deadline: 'Within 72 hours',
      priority: 1,
    });
  }

  // ========== WEEK 1 ==========
  const week1Steps: PlanStep[] = [];

  week1Steps.push({
    id: nextId(),
    phase: 'week_1',
    category: 'id',
    title: 'Replace your Social Security card',
    description: 'Free and essential for everything else.',
    instructions: [
      'Visit your local Social Security office (find at ssa.gov/locator)',
      'Or apply online at ssa.gov/myaccount if you have digital access',
      'Bring: photo ID or 2 forms of secondary ID',
      'If no photo ID: bring release papers + birth certificate',
      'Cost: FREE | Processing: ~14 days',
      'Tip: Go early morning to avoid long waits',
    ],
    documentsNeeded: ['Photo ID or 2 secondary IDs', 'Release paperwork'],
    deadline: 'This week',
    priority: 1,
  });

  week1Steps.push({
    id: nextId(),
    phase: 'week_1',
    category: 'healthcare',
    title: `Apply for ${stateName} Medicaid`,
    description: 'Most returning citizens qualify for free health coverage.',
    instructions: [
      `Apply online at your state\'s benefits portal`,
      'Most states automatically qualify returning citizens',
      'Coverage can backdate to your release date',
      'Includes mental health services and substance abuse treatment',
      'No cost to you — fully covered',
    ],
    documentsNeeded: ['Proof of identity', 'Proof of income (or lack thereof)', `Proof of ${stateName} residency`],
    deadline: 'This week',
    priority: 2,
  });

  week1Steps.push({
    id: nextId(),
    phase: 'week_1',
    category: 'benefits',
    title: 'Open a bank account',
    description: 'Second-chance banking — no credit check required.',
    instructions: [
      'Second-chance banks: Chime, Current, or local credit union',
      'Chime: No credit check, no minimum balance, no monthly fees',
      'Need: any form of ID + Social Security number',
      'Tip: Ask parole officer for an identity confirmation letter',
      'Direct deposit will be needed for employment',
    ],
    documentsNeeded: ['Any photo ID', 'Social Security number'],
    deadline: 'This week',
    priority: 3,
  });

  // ========== MONTH 1 ==========
  const month1Steps: PlanStep[] = [];

  month1Steps.push({
    id: nextId(),
    phase: 'month_1',
    category: 'id',
    title: `Get your ${stateName} State ID`,
    description: 'Your most important document — needed for almost everything.',
    instructions: [
      `Visit your state\'s DMV/Driver Services office`,
      'Bring: birth certificate + Social Security card + 2 proofs of address',
      'Proofs of address: shelter letter, parole officer letter, utility bill',
      'If no birth certificate: order one first (see separate step)',
      'Ask about fee waiver if cost is a barrier',
    ],
    documentsNeeded: ['Birth certificate', 'Social Security card', '2 proofs of residency'],
    deadline: 'Within 30 days',
    priority: 1,
  });

  month1Steps.push({
    id: nextId(),
    phase: 'month_1',
    category: 'benefits',
    title: 'Apply for SNAP (food stamps)',
    description: 'Monthly food benefits on an EBT card.',
    instructions: [
      `Apply at your state\'s benefits portal or call the state agency`,
      'You may qualify for expedited processing (same day if income < $150)',
      'Benefits: $234-$1,751/month depending on household size',
      'Bring: ID, proof of income, proof of address, SSN',
      'Most states allow online application',
    ],
    documentsNeeded: ['Photo ID', 'Proof of income', 'Proof of address', 'SSN'],
    deadline: 'Within 30 days',
    priority: 2,
  });

  month1Steps.push({
    id: nextId(),
    phase: 'month_1',
    category: 'employment',
    title: 'Start your job search',
    description: 'Employers who hire people with records.',
    instructions: [
      'Register at your state workforce center',
      'Visit local Goodwill or reentry organization for free job coaching',
      'Major conviction-friendly employers: Amazon, Walmart, FedEx, UPS, construction',
      'Use REENTRY\'s job matching feature to find opportunities',
      'Tip: Apply in person when possible — it shows initiative',
    ],
    documentsNeeded: ['State ID (or interim)', 'Social Security card'],
    deadline: 'Month 1',
    priority: 2,
  });

  month1Steps.push({
    id: nextId(),
    phase: 'month_1',
    category: 'housing',
    title: 'Find stable housing',
    description: 'Transitional housing and long-term options.',
    instructions: [
      'Apply for transitional housing through reentry services',
      'Contact your state\'s housing authority about Section 8',
      'Look for landlords who accept applicants with records',
      'Get a reference letter from your parole officer',
      'Call 211 for housing assistance programs in your area',
    ],
    documentsNeeded: ['Photo ID', 'Proof of income', 'Background check may be required'],
    deadline: 'Month 1',
    priority: 2,
  });

  if (intake.hasChildren) {
    month1Steps.push({
      id: nextId(),
      phase: 'month_1',
      category: 'family',
      title: 'Address child support obligations',
      description: 'Modify child support if your income has changed.',
      instructions: [
        'If you have existing child support: request a modification based on current income',
        'Contact your state\'s child support enforcement agency',
        'You may qualify for reduced payments while establishing employment',
        'DO NOT ignore child support — unpaid arrears can result in arrest',
        'Legal aid organizations can help with modification petitions for free',
      ],
      documentsNeeded: ['Proof of current income', 'Existing court order'],
      deadline: 'Month 1',
      priority: 3,
    });
  }

  // ========== ONGOING ==========
  const ongoingSteps: PlanStep[] = [];

  if (intake.supervisionType && intake.supervisionType !== 'none') {
    ongoingSteps.push({
      id: nextId(),
      phase: 'ongoing',
      category: 'supervision',
      title: `Maintain ${intake.supervisionType} compliance`,
      description: 'Stay on track with your supervision requirements.',
      instructions: [
        'Never miss a check-in — set calendar reminders',
        'Keep your officer updated on address and employment changes',
        'Complete all required programs (substance abuse, anger management, etc.)',
        'Be prepared for random drug tests at all times',
        'Good behavior can reduce check-in frequency over time',
      ],
      documentsNeeded: [],
      deadline: 'Ongoing',
      priority: 1,
    });
  }

  ongoingSteps.push({
    id: nextId(),
    phase: 'ongoing',
    category: 'legal',
    title: 'Check record expungement eligibility',
    description: 'You may be able to seal or expunge your record.',
    instructions: [
      'Contact your state\'s legal aid organization (free)',
      'Eligibility varies by state and offense type',
      'Some records can be sealed after sentence completion',
      'Expungement can open up employment and housing opportunities',
      'Start the process as soon as you\'re eligible — don\'t wait',
    ],
    documentsNeeded: ['Court records', 'Proof of sentence completion'],
    deadline: 'After sentence completion',
    priority: 3,
  });

  ongoingSteps.push({
    id: nextId(),
    phase: 'ongoing',
    category: 'education',
    title: 'Apply for Pell Grant (education funding)',
    description: 'Free money for college or vocational training — no repayment.',
    instructions: [
      'Apply at studentaid.gov (FAFSA)',
      'As of 2024, ALL returning citizens are eligible (law changed!)',
      'Up to $7,395/year for college or vocational training',
      'Skilled trades (HVAC, welding, electrical) have highest employment rates',
      'Many community colleges have programs specifically for returning citizens',
    ],
    documentsNeeded: ['Social Security number', 'Tax information (if any)'],
    deadline: 'When ready',
    priority: 3,
  });

  return {
    id: planId,
    userName: intake.fullName,
    state: intake.state,
    stateName,
    generatedAt: new Date().toISOString(),
    phases: [
      {
        id: 'immediate',
        label: 'First 72 Hours',
        description: 'Emergency needs — do these TODAY',
        color: 'bg-red-500',
        steps: immediateSteps,
      },
      {
        id: 'week_1',
        label: 'Week 1',
        description: 'ID, healthcare, and getting settled',
        color: 'bg-orange-500',
        steps: week1Steps,
      },
      {
        id: 'month_1',
        label: 'Month 1',
        description: 'Benefits, employment, and building stability',
        color: 'bg-blue-500',
        steps: month1Steps,
      },
      {
        id: 'ongoing',
        label: 'Months 2-12',
        description: 'Long-term stability and growth',
        color: 'bg-green-500',
        steps: ongoingSteps,
      },
    ],
  };
}
