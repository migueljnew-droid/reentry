/**
 * Deadline Cascade Engine — Test Suite
 *
 * Tests the core computation logic that determines whether a returning
 * citizen's deadline timeline is safe or at cascade risk.
 */

import { describe, it, expect } from 'vitest';
import { computeDeadlineCascade, formatDeadlineDate, getUrgencyLabel } from '@/lib/deadlines/engine';
import { getApplicableRules } from '@/lib/deadlines/rules';
import type { UserDeadlineProfile } from '@/lib/deadlines/types';

// Helper: create a profile with a fixed "today" for deterministic tests
function makeProfile(
  overrides: Partial<UserDeadlineProfile> & { daysAgoReleased?: number },
): UserDeadlineProfile {
  const today = new Date('2024-06-15T00:00:00');
  const daysAgo = overrides.daysAgoReleased ?? 0;
  const releaseDate = new Date(today);
  releaseDate.setDate(releaseDate.getDate() - daysAgo);

  return {
    releaseDate,
    releaseState: overrides.releaseState ?? 'GA',
    releaseType: overrides.releaseType ?? 'PAROLE',
    today,
    ...overrides,
  };
}

describe('getApplicableRules', () => {
  it('returns universal rules for any state', () => {
    const rules = getApplicableRules('TX', 'PAROLE');
    const ids = rules.map((r) => r.id);
    expect(ids).toContain('parole-report-24h');
    expect(ids).toContain('id-state-id-30');
    expect(ids).toContain('benefits-snap-apply');
  });

  it('includes Georgia-specific rules for GA', () => {
    const rules = getApplicableRules('GA', 'PAROLE');
    const ids = rules.map((r) => r.id);
    expect(ids).toContain('ga-dds-id-free');
    expect(ids).toContain('ga-dfcs-snap-7');
  });

  it('does NOT include Georgia-specific rules for CA', () => {
    const rules = getApplicableRules('CA', 'PAROLE');
    const ids = rules.map((r) => r.id);
    expect(ids).not.toContain('ga-dds-id-free');
    expect(ids).toContain('ca-calfresh-apply-7');
  });

  it('includes California-specific rules for CA', () => {
    const rules = getApplicableRules('CA', 'PAROLE');
    const ids = rules.map((r) => r.id);
    expect(ids).toContain('ca-calfresh-apply-7');
    expect(ids).toContain('ca-medi-cal-apply-14');
  });

  it('filters parole-only rules for UNCONDITIONAL release', () => {
    const parolRules = getApplicableRules('GA', 'PAROLE');
    const unconditionalRules = getApplicableRules('GA', 'UNCONDITIONAL');
    const paroleOnlyIds = parolRules
      .filter((r) => r.applicableReleaseTypes.includes('PAROLE') && r.applicableReleaseTypes.length > 0)
      .map((r) => r.id);
    // Parole-specific rules should not appear in unconditional
    for (const id of paroleOnlyIds) {
      expect(unconditionalRules.map((r) => r.id)).not.toContain(id);
    }
  });
});

describe('computeDeadlineCascade — basic computation', () => {
  it('returns deadlines sorted by due date', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 0 }));
    const dates = result.deadlines.map((d) => d.dueDate.getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
    }
  });

  it('computes correct daysRemaining for a fresh release', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 0 }));
    const paroleReport = result.deadlines.find((d) => d.rule.id === 'parole-report-24h');
    expect(paroleReport).toBeDefined();
    // Released today, due in 1 day
    expect(paroleReport!.daysRemaining).toBe(1);
  });

  it('marks deadlines as overdue when release was long ago', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 45 }));
    // parole-report-24h is due 1 day after release — 44 days overdue
    const paroleReport = result.deadlines.find((d) => d.rule.id === 'parole-report-24h');
    expect(paroleReport!.daysRemaining).toBeLessThan(0);
    expect(result.overdue.length).toBeGreaterThan(0);
    expect(result.summary.overdueCount).toBeGreaterThan(0);
  });

  it('populates critical bucket for deadlines due within 7 days', () => {
    // Released 6 days ago — parole-report-week1 (day 7) is due tomorrow
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 6 }));
    const criticalIds = result.critical.map((d) => d.rule.id);
    expect(criticalIds).toContain('parole-report-week1');
  });

  it('populates upcoming bucket for deadlines due 8-30 days out', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 0 }));
    // id-state-id-30 is due in 30 days — should be in upcoming
    const upcomingIds = result.upcoming.map((d) => d.rule.id);
    expect(upcomingIds).toContain('id-state-id-30');
  });
});

describe('computeDeadlineCascade — cascade detection', () => {
  it('marks a deadline as blocked when its dependency is overdue', () => {
    // Released 45 days ago — id-state-id-30 is overdue
    // benefits-snap-apply depends on id-state-id-30 → should be blocked
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 45 }));
    const snapDeadline = result.deadlines.find((d) => d.rule.id === 'benefits-snap-apply');
    expect(snapDeadline).toBeDefined();
    expect(snapDeadline!.isBlocked).toBe(true);
    expect(snapDeadline!.blockedBy.length).toBeGreaterThan(0);
    expect(snapDeadline!.cascadeRisk).toBe(true);
  });

  it('escalates urgency to CRITICAL when a dependency is overdue', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 45 }));
    const snapDeadline = result.deadlines.find((d) => d.rule.id === 'benefits-snap-apply');
    expect(snapDeadline!.urgency).toBe('CRITICAL');
  });

  it('includes cascade warning message when blocked', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 45 }));
    const snapDeadline = result.deadlines.find((d) => d.rule.id === 'benefits-snap-apply');
    expect(snapDeadline!.cascadeWarning).toBeTruthy();
    expect(snapDeadline!.cascadeWarning).toContain('overdue');
  });

  it('populates cascadeAlerts for all at-risk deadlines', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 45 }));
    expect(result.cascadeAlerts.length).toBeGreaterThan(0);
    expect(result.summary.cascadeRiskCount).toBe(result.cascadeAlerts.length);
  });

  it('does NOT mark deadlines as blocked when dependencies are on time', () => {
    // Fresh release — nothing is overdue yet
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 0 }));
    const blockedDeadlines = result.deadlines.filter((d) => d.isBlocked);
    expect(blockedDeadlines.length).toBe(0);
  });
});

describe('formatDeadlineDate', () => {
  it('returns OVERDUE message for past deadlines', () => {
    const _today = new Date('2024-06-15');
    const dueDate = new Date('2024-06-10');
    const label = formatDeadlineDate({
      rule: {} as never,
      dueDate,
      daysRemaining: -5,
      urgency: 'CRITICAL',
      cascadeRisk: false,
      isBlocked: false,
      blockedBy: [],
    });
    expect(label).toContain('OVERDUE');
    expect(label).toContain('5');
  });

  it('returns "Due TODAY" for same-day deadlines', () => {
    const label = formatDeadlineDate({
      rule: {} as never,
      dueDate: new Date(),
      daysRemaining: 0,
      urgency: 'CRITICAL',
      cascadeRisk: false,
      isBlocked: false,
      blockedBy: [],
    });
    expect(label).toBe('Due TODAY');
  });

  it('returns "Due TOMORROW" for 1-day deadlines', () => {
    const label = formatDeadlineDate({
      rule: {} as never,
      dueDate: new Date(),
      daysRemaining: 1,
      urgency: 'HIGH',
      cascadeRisk: false,
      isBlocked: false,
      blockedBy: [],
    });
    expect(label).toBe('Due TOMORROW');
  });

  it('returns day count for near-term deadlines', () => {
    const label = formatDeadlineDate({
      rule: {} as never,
      dueDate: new Date(),
      daysRemaining: 5,
      urgency: 'HIGH',
      cascadeRisk: false,
      isBlocked: false,
      blockedBy: [],
    });
    expect(label).toContain('5 days');
  });
});

describe('getUrgencyLabel', () => {
  it('returns plain-language labels for each tier', () => {
    expect(getUrgencyLabel('CRITICAL')).toContain('Urgent');
    expect(getUrgencyLabel('HIGH')).toContain('Important');
    expect(getUrgencyLabel('MEDIUM')).toContain('month');
    expect(getUrgencyLabel('LOW')).toContain('can');
  });
});

describe('summary statistics', () => {
  it('summary.total matches deadlines array length', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 0 }));
    expect(result.summary.total).toBe(result.deadlines.length);
  });

  it('summary.overdueCount matches overdue array length', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 60 }));
    expect(result.summary.overdueCount).toBe(result.overdue.length);
  });

  it('summary.criticalCount matches critical array length', () => {
    const result = computeDeadlineCascade(makeProfile({ daysAgoReleased: 6 }));
    expect(result.summary.criticalCount).toBe(result.critical.length);
  });
});
