/**
 * Deadline Cascade Engine — State-Aware Rule Database
 *
 * Each rule encodes a real obligation returning citizens face.
 * Rules are state-specific where laws differ, or universal where federal.
 *
 * Sources:
 * - Georgia DCS Parole Conditions (2024)
 * - California CDCR Parole Handbook (2024)
 * - Federal Supervised Release conditions (18 U.S.C. § 3583)
 * - SSA Program Operations Manual (POMS)
 * - SNAP eligibility restoration timelines
 */

import type { DeadlineRule } from './types';

export const DEADLINE_RULES: DeadlineRule[] = [
  // ─── PAROLE / SUPERVISION ───────────────────────────────────────────────
  {
    id: 'parole-report-24h',
    title: 'Report to Parole Officer',
    description:
      'You must report to your assigned parole/probation officer within 24 hours of release. Failure results in an immediate warrant.',
    category: 'PAROLE',
    daysAfterRelease: 1,
    urgency: 'CRITICAL',
    blocksDeadlineIds: ['parole-report-week1', 'housing-transitional'],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: ['PAROLE', 'PROBATION', 'SUPERVISED_RELEASE'],
    applicableStates: [],
    offlineCapable: true,
  },
  {
    id: 'parole-report-week1',
    title: 'First Weekly Parole Check-In',
    description:
      'Report to your parole officer for your first scheduled weekly check-in. Bring any documentation of housing and employment efforts.',
    category: 'PAROLE',
    daysAfterRelease: 7,
    urgency: 'CRITICAL',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['parole-report-24h'],
    applicableReleaseTypes: ['PAROLE', 'PROBATION', 'SUPERVISED_RELEASE'],
    applicableStates: [],
    offlineCapable: true,
  },
  {
    id: 'parole-monthly-30',
    title: 'Monthly Parole Report (Day 30)',
    description:
      'Submit your monthly supervision report. Include employment status, address, and any changes in circumstances.',
    category: 'PAROLE',
    daysAfterRelease: 30,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['parole-report-week1'],
    applicableReleaseTypes: ['PAROLE', 'PROBATION', 'SUPERVISED_RELEASE'],
    applicableStates: [],
    offlineCapable: true,
  },

  // ─── ID DOCUMENTS ────────────────────────────────────────────────────────
  {
    id: 'id-state-id-30',
    title: 'Obtain State ID or Driver\'s License',
    description:
      'Apply for a state-issued photo ID. Required for employment, housing applications, benefits enrollment, and banking. Many states offer free IDs for returning citizens.',
    category: 'ID_DOCUMENTS',
    daysAfterRelease: 30,
    urgency: 'CRITICAL',
    blocksDeadlineIds: [
      'benefits-snap-apply',
      'benefits-medicaid-apply',
      'employment-apply',
      'housing-apply',
      'banking-account',
    ],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: [],
    agencyContact: 'Visit your state DMV — bring release paperwork and birth certificate if available',
    offlineCapable: false,
  },
  {
    id: 'id-social-security-30',
    title: 'Replace Social Security Card',
    description:
      'Apply for a replacement Social Security card at your local SSA office. Free of charge. Required for employment and benefits.',
    category: 'ID_DOCUMENTS',
    daysAfterRelease: 30,
    urgency: 'HIGH',
    blocksDeadlineIds: ['benefits-snap-apply', 'employment-apply'],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: [],
    agencyContact: '1-800-772-1213 or ssa.gov',
    offlineCapable: false,
  },
  {
    id: 'id-birth-certificate-60',
    title: 'Obtain Birth Certificate',
    description:
      'Request a certified copy of your birth certificate from the vital records office in your birth state. Required for passport and some employment.',
    category: 'ID_DOCUMENTS',
    daysAfterRelease: 60,
    urgency: 'MEDIUM',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: [],
    offlineCapable: false,
  },

  // ─── BENEFITS ────────────────────────────────────────────────────────────
  {
    id: 'benefits-snap-apply',
    title: 'Apply for SNAP (Food Stamps)',
    description:
      'Apply for SNAP benefits at your local DFCS/DSS office or online. Most returning citizens are eligible immediately. Benefits can start within 7 days if you qualify for expedited processing.',
    category: 'BENEFITS',
    daysAfterRelease: 14,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['id-state-id-30', 'id-social-security-30'],
    applicableReleaseTypes: [],
    applicableStates: [],
    agencyContact: 'benefits.gov or your state SNAP office',
    offlineCapable: false,
  },
  {
    id: 'benefits-medicaid-apply',
    title: 'Apply for Medicaid / Healthcare',
    description:
      'Apply for Medicaid or your state\'s health insurance program. Coverage can begin immediately for eligible individuals. Critical for mental health and substance use treatment.',
    category: 'BENEFITS',
    daysAfterRelease: 14,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['id-state-id-30'],
    applicableReleaseTypes: [],
    applicableStates: [],
    agencyContact: 'healthcare.gov or your state Medicaid office',
    offlineCapable: false,
  },
  {
    id: 'benefits-lifeline-phone-30',
    title: 'Apply for Lifeline Free Phone Service',
    description:
      'Apply for the federal Lifeline program for free or discounted phone service. A phone is essential for parole compliance, job applications, and emergency contact.',
    category: 'BENEFITS',
    daysAfterRelease: 30,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['id-state-id-30'],
    applicableReleaseTypes: [],
    applicableStates: [],
    agencyContact: 'lifelinesupport.org',
    offlineCapable: false,
  },
  {
    id: 'benefits-ssi-apply-60',
    title: 'Apply for SSI/SSDI (if eligible)',
    description:
      'If you have a disability, apply for Supplemental Security Income (SSI) or Social Security Disability Insurance (SSDI). Processing takes 3-6 months — apply immediately.',
    category: 'BENEFITS',
    daysAfterRelease: 60,
    urgency: 'MEDIUM',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['id-social-security-30'],
    applicableReleaseTypes: [],
    applicableStates: [],
    agencyContact: '1-800-772-1213 or ssa.gov/disability',
    offlineCapable: false,
  },

  // ─── HOUSING ─────────────────────────────────────────────────────────────
  {
    id: 'housing-transitional',
    title: 'Secure Transitional Housing',
    description:
      'Contact transitional housing programs in your area. Many have waiting lists — apply immediately. Stable housing is the single strongest predictor of successful reentry.',
    category: 'HOUSING',
    daysAfterRelease: 3,
    urgency: 'CRITICAL',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['parole-report-24h'],
    applicableReleaseTypes: [],
    applicableStates: [],
    offlineCapable: true,
  },
  {
    id: 'housing-apply',
    title: 'Apply for Permanent Housing / Section 8',
    description:
      'Apply for public housing or Section 8 vouchers. Waiting lists can be 1-3 years — apply now. Some PHAs ban people with certain convictions; know your rights.',
    category: 'HOUSING',
    daysAfterRelease: 30,
    urgency: 'MEDIUM',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['id-state-id-30'],
    applicableReleaseTypes: [],
    applicableStates: [],
    offlineCapable: false,
  },

  // ─── EMPLOYMENT ──────────────────────────────────────────────────────────
  {
    id: 'employment-workforce-register',
    title: 'Register with Workforce Development / American Job Center',
    description:
      'Register at your local American Job Center (formerly One-Stop). Free job placement, resume help, and training. Many have reentry-specific programs.',
    category: 'EMPLOYMENT',
    daysAfterRelease: 14,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: [],
    agencyContact: 'careeronestop.org or 1-877-872-5627',
    offlineCapable: false,
  },
  {
    id: 'employment-apply',
    title: 'Begin Job Applications',
    description:
      'Start applying to reentry-friendly employers. Focus on companies with ban-the-box policies and those that have signed the Fair Chance Business Pledge.',
    category: 'EMPLOYMENT',
    daysAfterRelease: 30,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['id-state-id-30', 'id-social-security-30'],
    applicableReleaseTypes: [],
    applicableStates: [],
    offlineCapable: false,
  },

  // ─── BANKING ─────────────────────────────────────────────────────────────
  {
    id: 'banking-account',
    title: 'Open a Bank Account',
    description:
      'Open a checking account at a bank or credit union. Look for "second chance" accounts if you have ChexSystems issues. Required for direct deposit employment.',
    category: 'EMPLOYMENT',
    daysAfterRelease: 30,
    urgency: 'MEDIUM',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['id-state-id-30'],
    applicableReleaseTypes: [],
    applicableStates: [],
    offlineCapable: false,
  },

  // ─── HEALTHCARE ──────────────────────────────────────────────────────────
  {
    id: 'healthcare-mental-health-30',
    title: 'Schedule Mental Health / Substance Use Assessment',
    description:
      'Schedule an assessment with a community mental health center. Many parole conditions require this. Early treatment dramatically reduces recidivism risk.',
    category: 'HEALTHCARE',
    daysAfterRelease: 30,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: ['benefits-medicaid-apply'],
    applicableReleaseTypes: [],
    applicableStates: [],
    offlineCapable: false,
  },

  // ─── GEORGIA-SPECIFIC ────────────────────────────────────────────────────
  {
    id: 'ga-dds-id-free',
    title: 'Georgia: Free State ID from DDS',
    description:
      'Georgia DDS provides a free state ID to returning citizens within 30 days of release. Bring your release certificate to any DDS office.',
    category: 'ID_DOCUMENTS',
    daysAfterRelease: 30,
    urgency: 'CRITICAL',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: ['GA'],
    agencyContact: 'dds.georgia.gov or 678-413-8400',
    offlineCapable: false,
  },
  {
    id: 'ga-dfcs-snap-7',
    title: 'Georgia: DFCS SNAP Application (Expedited)',
    description:
      'Apply for SNAP at Georgia DFCS within 7 days for expedited processing. Georgia restored SNAP eligibility for most returning citizens in 2023.',
    category: 'BENEFITS',
    daysAfterRelease: 7,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: ['GA'],
    agencyContact: 'compass.ga.gov or 1-877-423-4746',
    offlineCapable: false,
  },

  // ─── CALIFORNIA-SPECIFIC ─────────────────────────────────────────────────
  {
    id: 'ca-calfresh-apply-7',
    title: 'California: Apply for CalFresh (SNAP)',
    description:
      'Apply for CalFresh within 7 days. California has no drug felony ban on CalFresh. Expedited benefits available within 3 days for those with little or no income.',
    category: 'BENEFITS',
    daysAfterRelease: 7,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: ['CA'],
    agencyContact: 'getcalfresh.org or 1-877-847-3663',
    offlineCapable: false,
  },
  {
    id: 'ca-medi-cal-apply-14',
    title: 'California: Apply for Medi-Cal',
    description:
      'Apply for Medi-Cal (California Medicaid). Coverage begins the month you apply. California expanded Medi-Cal to incarcerated individuals 90 days pre-release.',
    category: 'BENEFITS',
    daysAfterRelease: 14,
    urgency: 'HIGH',
    blocksDeadlineIds: [],
    dependsOnDeadlineIds: [],
    applicableReleaseTypes: [],
    applicableStates: ['CA'],
    agencyContact: 'coveredca.com or 1-800-300-1506',
    offlineCapable: false,
  },
];

/** Get rules applicable to a given state and release type */
export function getApplicableRules(
  state: string,
  releaseType: string,
): DeadlineRule[] {
  return DEADLINE_RULES.filter((rule) => {
    const stateMatch =
      rule.applicableStates.length === 0 ||
      rule.applicableStates.includes(state.toUpperCase());
    const releaseMatch =
      rule.applicableReleaseTypes.length === 0 ||
      rule.applicableReleaseTypes.includes(releaseType as never);
    return stateMatch && releaseMatch;
  });
}
