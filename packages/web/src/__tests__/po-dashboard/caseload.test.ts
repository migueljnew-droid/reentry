import { describe, it, expect } from 'vitest';
import {
  sortByRisk,
  filterByStatus,
  computeCaseloadSummary,
  type CaseloadMember,
} from '@/lib/po-dashboard/caseload';
import {
  getRiskColor,
  buildRiskHeatmap,
  scoreToRiskLevel,
} from '@/lib/po-dashboard/risk-heatmap';

const now = new Date();
const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();

const BASE: CaseloadMember[] = [
  {
    id: '1', firstName: 'A', lastName: 'Alpha',
    releaseDate: '2024-01-01', supervisionState: 'GA',
    riskLevel: 'low', riskScore: 25, status: 'compliant',
    nextCheckIn: inTenDays, missedCheckIns: 0, openConditions: 0,
    assignedOfficerId: 'po-1', convictionType: 'misdemeanor', daysUntilDischarge: 60,
  },
  {
    id: '2', firstName: 'B', lastName: 'Beta',
    releaseDate: '2024-02-01', supervisionState: 'GA',
    riskLevel: 'critical', riskScore: 90, status: 'at_risk',
    nextCheckIn: inThreeDays, missedCheckIns: 3, openConditions: 4,
    assignedOfficerId: 'po-1', convictionType: 'felony', daysUntilDischarge: 400,
  },
  {
    id: '3', firstName: 'C', lastName: 'Gamma',
    releaseDate: '2024-03-01', supervisionState: 'GA',
    riskLevel: 'high', riskScore: 65, status: 'active',
    nextCheckIn: inThreeDays, missedCheckIns: 1, openConditions: 2,
    assignedOfficerId: 'po-1', convictionType: 'felony', daysUntilDischarge: 200,
  },
  {
    id: '4', firstName: 'D', lastName: 'Delta',
    releaseDate: '2024-04-01', supervisionState: 'GA',
    riskLevel: 'critical', riskScore: 82, status: 'absconded',
    nextCheckIn: null, missedCheckIns: 5, openConditions: 6,
    assignedOfficerId: 'po-1', convictionType: 'felony', daysUntilDischarge: null,
  },
];

describe('sortByRisk', () => {
  it('places critical members before high and low', () => {
    const sorted = sortByRisk(BASE);
    expect(sorted[0].riskLevel).toBe('critical');
    expect(sorted[1].riskLevel).toBe('critical');
    expect(sorted[2].riskLevel).toBe('high');
    expect(sorted[3].riskLevel).toBe('low');
  });

  it('within the same risk level, sorts by riskScore descending', () => {
    const sorted = sortByRisk(BASE);
    const criticals = sorted.filter((m) => m.riskLevel === 'critical');
    expect(criticals[0].riskScore).toBeGreaterThanOrEqual(criticals[1].riskScore);
  });

  it('does not mutate the original array', () => {
    const original = [...BASE];
    sortByRisk(BASE);
    expect(BASE.map((m) => m.id)).toEqual(original.map((m) => m.id));
  });
});

describe('filterByStatus', () => {
  it('returns only members matching the given statuses', () => {
    const result = filterByStatus(BASE, ['absconded']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('returns all members when statuses array is empty', () => {
    expect(filterByStatus(BASE, [])).toHaveLength(BASE.length);
  });
});

describe('computeCaseloadSummary', () => {
  it('counts total members correctly', () => {
    const summary = computeCaseloadSummary(BASE);
    expect(summary.total).toBe(4);
  });

  it('aggregates missed check-ins', () => {
    const summary = computeCaseloadSummary(BASE);
    expect(summary.missedCheckInsTotal).toBe(3 + 1 + 5); // members 2,3,4
  });

  it('counts absconded members', () => {
    const summary = computeCaseloadSummary(BASE);
    expect(summary.abscondedCount).toBe(1);
  });

  it('returns 0 averageRiskScore for empty caseload', () => {
    expect(computeCaseloadSummary([]).averageRiskScore).toBe(0);
  });

  it('counts check-ins within next 7 days', () => {
    const summary = computeCaseloadSummary(BASE);
    // members 2 and 3 have check-ins in 3 days; member 1 in 10 days
    expect(summary.checkInsNext7Days).toBe(2);
  });
});

describe('getRiskColor', () => {
  it('returns red hex for critical', () => {
    expect(getRiskColor('critical').hex).toBe('#dc2626');
  });

  it('returns green hex for minimal', () => {
    expect(getRiskColor('minimal').hex).toBe('#4ade80');
  });
});

describe('buildRiskHeatmap', () => {
  it('produces one cell per member', () => {
    const heatmap = buildRiskHeatmap(BASE);
    expect(heatmap.cells).toHaveLength(BASE.length);
  });

  it('orders cells critical-first', () => {
    const heatmap = buildRiskHeatmap(BASE);
    expect(heatmap.cells[0].riskLevel).toBe('critical');
  });
});

describe('scoreToRiskLevel', () => {
  it('maps 95 → critical', () => expect(scoreToRiskLevel(95)).toBe('critical'));
  it('maps 10 → minimal', () => expect(scoreToRiskLevel(10)).toBe('minimal'));
  it('maps 60 → high', () => expect(scoreToRiskLevel(60)).toBe('high'));
});
