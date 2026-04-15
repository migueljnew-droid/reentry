/**
 * Deadline Cascade Engine — Core Computation
 *
 * Given a user profile (release date, state, release type), computes:
 * 1. All applicable deadlines with absolute due dates
 * 2. Urgency tiers (escalated if cascade risk detected)
 * 3. Cascade risk: which deadlines are endangered by overdue dependencies
 * 4. Blocked status: which deadlines cannot be started yet
 *
 * This is the heart of the reentry navigator — it turns a release date
 * into a prioritized, actionable timeline that prevents the deadline
 * avalanche that sends people back to prison.
 */

import { getApplicableRules } from './rules';
import type {
  ComputedDeadline,
  DeadlineCascadeResult,
  DeadlineRule,
  UserDeadlineProfile,
} from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Escalate urgency when cascade risk is detected.
 * MEDIUM → HIGH, HIGH → CRITICAL (CRITICAL stays CRITICAL).
 */
function escalateUrgency(
  base: ComputedDeadline['urgency'],
): ComputedDeadline['urgency'] {
  if (base === 'LOW') return 'MEDIUM';
  if (base === 'MEDIUM') return 'HIGH';
  return 'CRITICAL';
}

/**
 * Core engine: compute the full deadline cascade for a user profile.
 */
export function computeDeadlineCascade(
  profile: UserDeadlineProfile,
): DeadlineCascadeResult {
  const today = profile.today ?? new Date();
  const rules = getApplicableRules(profile.releaseState, profile.releaseType);

  // Build a lookup map for fast dependency resolution
  const _ruleMap = new Map<string, DeadlineRule>(rules.map((r) => [r.id, r]));

  // First pass: compute base deadlines without cascade analysis
  const baseDeadlines = new Map<string, ComputedDeadline>();

  for (const rule of rules) {
    const dueDate = addDays(profile.releaseDate, rule.daysAfterRelease);
    const daysRemaining = daysBetween(today, dueDate);

    baseDeadlines.set(rule.id, {
      rule,
      dueDate,
      daysRemaining,
      urgency: rule.urgency,
      cascadeRisk: false,
      isBlocked: false,
      blockedBy: [],
    });
  }

  // Second pass: cascade analysis
  // For each deadline, check if any of its dependencies are overdue or at risk
  const computed: ComputedDeadline[] = [];

  for (const [, deadline] of baseDeadlines) {
    const rule = deadline.rule;
    let cascadeRisk = false;
    let cascadeWarning: string | undefined;
    let isBlocked = false;
    const blockedBy: string[] = [];
    let urgency = deadline.urgency;

    // Check dependencies
    for (const depId of rule.dependsOnDeadlineIds) {
      const dep = baseDeadlines.get(depId);
      if (!dep) continue;

      // If dependency is overdue, this deadline is blocked
      if (dep.daysRemaining < 0) {
        isBlocked = true;
        blockedBy.push(dep.rule.title);
        cascadeRisk = true;
        cascadeWarning = `Blocked: "${dep.rule.title}" is overdue by ${Math.abs(dep.daysRemaining)} days. Complete it immediately to unblock this step.`;
        urgency = 'CRITICAL';
      } else if (dep.daysRemaining <= 7 && deadline.daysRemaining > dep.daysRemaining) {
        // Dependency is due soon and this deadline depends on it
        cascadeRisk = true;
        cascadeWarning = `At risk: "${dep.rule.title}" must be done first and is due in ${dep.daysRemaining} days.`;
        urgency = escalateUrgency(urgency);
      }
    }

    // Check if this deadline blocks others that are coming up soon
    if (!cascadeRisk && deadline.daysRemaining <= 14) {
      const blockedDownstream = rule.blocksDeadlineIds
        .map((bid) => baseDeadlines.get(bid))
        .filter((d): d is ComputedDeadline => !!d && d.daysRemaining <= 30);

      if (blockedDownstream.length > 0) {
        cascadeRisk = true;
        const titles = blockedDownstream.map((d) => `"${d.rule.title}"`).join(', ');
        cascadeWarning = `Completing this unlocks: ${titles}. Don't delay.`;
        urgency = escalateUrgency(urgency);
      }
    }

    computed.push({
      ...deadline,
      urgency,
      cascadeRisk,
      cascadeWarning,
      isBlocked,
      blockedBy,
    });
  }

  // Sort by due date ascending
  computed.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const overdue = computed.filter((d) => d.daysRemaining < 0);
  const critical = computed.filter((d) => d.daysRemaining >= 0 && d.daysRemaining <= 7);
  const upcoming = computed.filter((d) => d.daysRemaining > 7 && d.daysRemaining <= 30);
  const cascadeAlerts = computed.filter((d) => d.cascadeRisk);

  return {
    deadlines: computed,
    critical,
    upcoming,
    overdue,
    cascadeAlerts,
    summary: {
      total: computed.length,
      overdueCount: overdue.length,
      criticalCount: critical.length,
      cascadeRiskCount: cascadeAlerts.length,
    },
  };
}

/**
 * Format a deadline's due date as a human-readable string.
 * Designed for low-literacy users — plain language, no jargon.
 */
export function formatDeadlineDate(deadline: ComputedDeadline): string {
  const { daysRemaining, dueDate } = deadline;

  if (daysRemaining < 0) {
    const days = Math.abs(daysRemaining);
    return `OVERDUE by ${days} day${days === 1 ? '' : 's'} — Act now`;
  }
  if (daysRemaining === 0) return 'Due TODAY';
  if (daysRemaining === 1) return 'Due TOMORROW';
  if (daysRemaining <= 7) return `Due in ${daysRemaining} days`;

  return dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get a plain-language urgency label for voice/TTS output.
 */
export function getUrgencyLabel(urgency: ComputedDeadline['urgency']): string {
  switch (urgency) {
    case 'CRITICAL': return 'Urgent — do this first';
    case 'HIGH': return 'Important — do this soon';
    case 'MEDIUM': return 'Do this within the month';
    case 'LOW': return 'Do this when you can';
  }
}
