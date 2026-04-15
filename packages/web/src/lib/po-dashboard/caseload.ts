/**
 * PO Dashboard — Caseload Management
 * B2G revenue engine: parole officer view of their assigned caseload.
 * Provides sorting, filtering, and summary statistics for risk-aware supervision.
 */

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export type SupervisionStatus =
  | 'active'
  | 'compliant'
  | 'at_risk'
  | 'absconded'
  | 'discharged'
  | 'revoked';

export interface CaseloadMember {
  id: string;
  firstName: string;
  lastName: string;
  /** ISO date string of release */
  releaseDate: string;
  /** 2-letter state code */
  supervisionState: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0–100
  status: SupervisionStatus;
  nextCheckIn: string | null; // ISO date string
  missedCheckIns: number;
  openConditions: number; // unmet supervision conditions
  assignedOfficerId: string;
  convictionType: string;
  daysUntilDischarge: number | null;
}

export interface CaseloadSummary {
  total: number;
  byRisk: Record<RiskLevel, number>;
  byStatus: Record<SupervisionStatus, number>;
  missedCheckInsTotal: number;
  abscondedCount: number;
  checkInsNext7Days: number;
  averageRiskScore: number;
}

// Risk level ordering for sort (critical = highest priority)
const RISK_ORDER: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  minimal: 4,
};

/**
 * Sort caseload members by risk level (critical first), then by riskScore desc.
 * Stable sort — members with equal risk preserve original order.
 */
export function sortByRisk(members: CaseloadMember[]): CaseloadMember[] {
  return [...members].sort((a, b) => {
    const levelDiff = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
    if (levelDiff !== 0) return levelDiff;
    return b.riskScore - a.riskScore;
  });
}

/**
 * Filter caseload by one or more supervision statuses.
 * Passing an empty array returns all members.
 */
export function filterByStatus(
  members: CaseloadMember[],
  statuses: SupervisionStatus[]
): CaseloadMember[] {
  if (statuses.length === 0) return members;
  const set = new Set(statuses);
  return members.filter((m) => set.has(m.status));
}

/**
 * Filter caseload by risk level.
 * Passing an empty array returns all members.
 */
export function filterByRisk(
  members: CaseloadMember[],
  levels: RiskLevel[]
): CaseloadMember[] {
  if (levels.length === 0) return members;
  const set = new Set(levels);
  return members.filter((m) => set.has(m.riskLevel));
}

/**
 * Compute aggregate summary statistics for a caseload.
 * Used to populate dashboard KPI cards.
 */
export function computeCaseloadSummary(members: CaseloadMember[]): CaseloadSummary {
  const byRisk: Record<RiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    minimal: 0,
  };

  const byStatus: Record<SupervisionStatus, number> = {
    active: 0,
    compliant: 0,
    at_risk: 0,
    absconded: 0,
    discharged: 0,
    revoked: 0,
  };

  let missedCheckInsTotal = 0;
  let riskScoreSum = 0;
  let checkInsNext7Days = 0;

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  for (const m of members) {
    byRisk[m.riskLevel] = (byRisk[m.riskLevel] ?? 0) + 1;
    byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
    missedCheckInsTotal += m.missedCheckIns;
    riskScoreSum += m.riskScore;

    if (m.nextCheckIn) {
      const checkInTime = new Date(m.nextCheckIn).getTime();
      if (checkInTime >= now && checkInTime <= now + sevenDaysMs) {
        checkInsNext7Days += 1;
      }
    }
  }

  return {
    total: members.length,
    byRisk,
    byStatus,
    missedCheckInsTotal,
    abscondedCount: byStatus.absconded,
    checkInsNext7Days,
    averageRiskScore:
      members.length > 0 ? Math.round(riskScoreSum / members.length) : 0,
  };
}

/**
 * Return members whose next check-in falls within the next N days.
 * Useful for the "upcoming" panel on the dashboard.
 */
export function getUpcomingCheckIns(
  members: CaseloadMember[],
  withinDays = 7
): CaseloadMember[] {
  const now = Date.now();
  const windowMs = withinDays * 24 * 60 * 60 * 1000;
  return members.filter((m) => {
    if (!m.nextCheckIn) return false;
    const t = new Date(m.nextCheckIn).getTime();
    return t >= now && t <= now + windowMs;
  });
}
