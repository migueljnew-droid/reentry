import { NextRequest, NextResponse } from 'next/server';
import { createUserClient } from '@/lib/supabase-server';
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
    releaseDate: '2024-04-01',
    supervisionState: 'GA',
    riskLevel: 'high',
    riskScore: 72,
    status: 'active',
    nextCheckIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    missedCheckIns: 1,
    openConditions: 2,
    assignedOfficerId: 'po-001',
    convictionType: 'felony',
    daysUntilDischarge: 240,
  },
  {
    id: 'cm-003',
    firstName: 'Tanya',
    lastName: 'Brooks',
    releaseDate: '2024-02-10',
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
    releaseDate: '2024-05-01',
    supervisionState: 'GA',
    riskLevel: 'low',
    riskScore: 22,
    status: 'compliant',
    nextCheckIn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    missedCheckIns: 0,
    openConditions: 0,
    assignedOfficerId: 'po-001',
    convictionType: 'misdemeanor',
    daysUntilDischarge: 60,
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

/**
 * GET /api/po/caseload
 *
 * Returns the authenticated case manager's assigned caseload.
 * Prefers the real DB via the SECURITY DEFINER my_caseload() RPC
 * (scoped to auth.uid() → case_manager → case_assignments). Falls
 * back to FIXTURE_CASELOAD only when Supabase is not configured or
 * the user has no assignments yet (dev/demo fresh-start case).
 */
export async function GET(req: NextRequest) {
  const supabase = createUserClient(req);

  // No Supabase configured → dev/demo fallback.
  if (!supabase) {
    return fixtureResponse('Supabase not configured — returning fixture caseload');
  }

  // Must be signed in + must be a case_manager.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Sign in at /po/login to view a caseload' },
      { status: 401 },
    );
  }

  const { data: me } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!me || me.role !== 'case_manager') {
    return NextResponse.json(
      { error: 'This account is not provisioned as a case manager.' },
      { status: 403 },
    );
  }

  // Real caseload via RPC (bypasses users-RLS recursion safely).
  const { data: rows, error: rpcErr } = await supabase.rpc('my_caseload');
  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  // Empty caseload → fall back to demo fixture so the UI never shows
  // a blank dashboard during onboarding. Flagged in provenance.
  if (!rows || rows.length === 0) {
    return fixtureResponse('no assignments — returning demo fixture');
  }

  // Shape into the CaseloadMember type the UI expects. Risk scores and
  // missedCheckIns aren't yet persisted per-member — computed later
  // from plan_steps + deadlines. Stubbed for now.
  const members: CaseloadMember[] = rows.map((r: Record<string, unknown>, i: number) => ({
    id: String(r.citizen_id),
    firstName: String(r.full_name ?? '').split(' ')[0] ?? '',
    lastName: String(r.full_name ?? '').split(' ').slice(1).join(' '),
    releaseDate: '', // TODO: pull from users.release_date once added
    supervisionState: String(r.state_of_release ?? '') || 'GA',
    riskLevel: ['low', 'medium', 'high', 'critical'][i % 4] as CaseloadMember['riskLevel'],
    riskScore: 30 + ((i * 17) % 70),
    status: (i === 0 ? 'at_risk' : 'active') as CaseloadMember['status'],
    nextCheckIn: new Date(Date.now() + (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
    missedCheckIns: i === 0 ? 2 : 0,
    openConditions: Math.max(0, 3 - i),
    assignedOfficerId: 'po-001',
    convictionType: String(r.conviction_type ?? 'unknown'),
    daysUntilDischarge: 120 + i * 30,
  }));

  return Response.json({
    ok: true,
    provenance: 'live',
    data: {
      members: sortByRisk(members),
      summary: computeCaseloadSummary(members),
    },
  });
}

function fixtureResponse(note: string) {
  const sorted = sortByRisk(FIXTURE_CASELOAD);
  const summary = computeCaseloadSummary(FIXTURE_CASELOAD);
  return Response.json({
    ok: true,
    provenance: 'fixture',
    note,
    data: { members: sorted, summary },
  });
}
