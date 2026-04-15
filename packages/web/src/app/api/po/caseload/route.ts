/**
 * GET /api/po/caseload
 * Returns the fixture caseload for the authenticated parole officer.
 * Production: replace fixture with Supabase query filtered by officer JWT.
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import type { CaseloadMember } from '@/lib/po-dashboard/caseload';
import { computeCaseloadSummary, sortByRisk } from '@/lib/po-dashboard/caseload';

const FIXTURE_CASELOAD: CaseloadMember[] = [
  {
    id: 'cm-001',
    firstName: 'Marcus',
    lastName: 'Williams',
    releaseDate: '2024-03-15',
    supervisionState: 'GA',
    riskLevel: 'critical',
    riskScore: 88,
    status: 'at_risk',
    nextCheckIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    missedCheckIns: 2,
    openConditions: 3,
    assignedOfficerId: 'po-001',
    convictionType: 'felony',
    daysUntilDischarge: 180,
  },
  {
    id: 'cm-002',
    firstName: 'Darnell',
    lastName: 'Johnson',
    releaseDate: '2024-06-01',
    supervisionState: 'GA',
    riskLevel: 'high',
    riskScore: 72,
    status: 'active',
    nextCheckIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    missedCheckIns: 1,
    openConditions: 2,
    assignedOfficerId: 'po-001',
    convictionType: 'felony',
    daysUntilDischarge: 365,
  },
  {
    id: 'cm-003',
    firstName: 'Tanya',
    lastName: 'Brooks',
    releaseDate: '2024-08-20',
    supervisionState: 'GA',
    riskLevel: 'medium',
    riskScore: 45,
    status: 'compliant',
    nextCheckIn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    missedCheckIns: 0,
    openConditions: 1,
    assignedOfficerId: 'po-001',
    convictionType: 'misdemeanor',
    daysUntilDischarge: 90,
  },
  {
    id: 'cm-004',
    firstName: 'Jerome',
    lastName: 'Carter',
    releaseDate: '2023-11-10',
    supervisionState: 'GA',
    riskLevel: 'low',
    riskScore: 22,
    status: 'compliant',
    nextCheckIn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    missedCheckIns: 0,
    openConditions: 0,
    assignedOfficerId: 'po-001',
    convictionType: 'misdemeanor',
    daysUntilDischarge: 30,
  },
  {
    id: 'cm-005',
    firstName: 'Latoya',
    lastName: 'Davis',
    releaseDate: '2024-01-05',
    supervisionState: 'GA',
    riskLevel: 'critical',
    riskScore: 95,
    status: 'absconded',
    nextCheckIn: null,
    missedCheckIns: 4,
    openConditions: 5,
    assignedOfficerId: 'po-001',
    convictionType: 'felony',
    daysUntilDischarge: 540,
  },
];

export const GET = withErrorHandler(async (_req: Request) => {
  const sorted = sortByRisk(FIXTURE_CASELOAD);
  const summary = computeCaseloadSummary(FIXTURE_CASELOAD);

  return Response.json({
    ok: true,
    data: {
      members: sorted,
      summary,
    },
  });
});
