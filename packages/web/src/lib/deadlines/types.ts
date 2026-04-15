/**
 * Deadline Cascade Engine — Type Definitions
 *
 * Models the time-sequenced obligations a returning citizen must meet.
 * Missing any one deadline can cascade into warrant, housing loss, or
 * benefits termination — the primary driver of recidivism.
 */

export type UrgencyTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DeadlineCategory =
  | 'PAROLE'
  | 'ID_DOCUMENTS'
  | 'BENEFITS'
  | 'HOUSING'
  | 'EMPLOYMENT'
  | 'COURT'
  | 'HEALTHCARE'
  | 'EDUCATION';

export type ReleaseType = 'PAROLE' | 'PROBATION' | 'SUPERVISED_RELEASE' | 'UNCONDITIONAL';

export interface DeadlineRule {
  /** Unique identifier for this rule */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description of what must be done */
  description: string;
  /** Category for grouping and filtering */
  category: DeadlineCategory;
  /** Days after release date when this deadline falls due */
  daysAfterRelease: number;
  /** Urgency if not completed by due date */
  urgency: UrgencyTier;
  /** IDs of deadlines that CANNOT be met if this one is missed */
  blocksDeadlineIds: string[];
  /** IDs of deadlines that must be completed BEFORE this one */
  dependsOnDeadlineIds: string[];
  /** Which release types this rule applies to (empty = all) */
  applicableReleaseTypes: ReleaseType[];
  /** Which states this rule applies to (empty = all states) */
  applicableStates: string[];
  /** Phone number or URL for the relevant agency */
  agencyContact?: string;
  /** Whether this deadline can be completed offline */
  offlineCapable: boolean;
}

export interface ComputedDeadline {
  rule: DeadlineRule;
  /** Absolute due date */
  dueDate: Date;
  /** Days remaining from today (negative = overdue) */
  daysRemaining: number;
  /** Computed urgency (may escalate if dependencies are at risk) */
  urgency: UrgencyTier;
  /** True if a dependency deadline is overdue or at risk */
  cascadeRisk: boolean;
  /** Human-readable cascade warning message */
  cascadeWarning?: string;
  /** Whether this deadline is currently blocked by an incomplete dependency */
  isBlocked: boolean;
  /** Titles of blocking deadlines */
  blockedBy: string[];
}

export interface DeadlineCascadeResult {
  /** All computed deadlines sorted by due date */
  deadlines: ComputedDeadline[];
  /** Deadlines due within 7 days */
  critical: ComputedDeadline[];
  /** Deadlines due within 30 days */
  upcoming: ComputedDeadline[];
  /** Any deadline that is overdue */
  overdue: ComputedDeadline[];
  /** Deadlines with cascade risk */
  cascadeAlerts: ComputedDeadline[];
  /** Summary stats */
  summary: {
    total: number;
    overdueCount: number;
    criticalCount: number;
    cascadeRiskCount: number;
  };
}

export interface UserDeadlineProfile {
  releaseDate: Date;
  releaseState: string;
  releaseType: ReleaseType;
  /** Today's date — injectable for testing */
  today?: Date;
}
