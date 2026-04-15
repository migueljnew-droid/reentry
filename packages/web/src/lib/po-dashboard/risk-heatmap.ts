/**
 * PO Dashboard — Risk Heatmap
 * Provides 5-bucket color coding and heatmap data structures
 * for visualising caseload risk distribution at a glance.
 */

import type { RiskLevel, CaseloadMember } from './caseload';

/** Tailwind-compatible color tokens for each risk bucket */
export interface RiskColorSet {
  bg: string;      // background class
  text: string;    // text class
  border: string;  // border class
  hex: string;     // raw hex for canvas/SVG rendering
}

const RISK_COLORS: Record<RiskLevel, RiskColorSet> = {
  critical: {
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600',
    hex: '#dc2626',
  },
  high: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    border: 'border-orange-500',
    hex: '#f97316',
  },
  medium: {
    bg: 'bg-yellow-400',
    text: 'text-yellow-600',
    border: 'border-yellow-400',
    hex: '#facc15',
  },
  low: {
    bg: 'bg-blue-400',
    text: 'text-blue-600',
    border: 'border-blue-400',
    hex: '#60a5fa',
  },
  minimal: {
    bg: 'bg-green-400',
    text: 'text-green-600',
    border: 'border-green-400',
    hex: '#4ade80',
  },
};

/** Return the color set for a given risk level */
export function getRiskColor(level: RiskLevel): RiskColorSet {
  return RISK_COLORS[level];
}

/** A single cell in the heatmap grid */
export interface HeatmapCell {
  memberId: string;
  displayName: string;
  riskLevel: RiskLevel;
  riskScore: number;
  color: RiskColorSet;
  /** Tooltip label shown on hover */
  label: string;
}

/** Full heatmap data ready for rendering */
export interface RiskHeatmap {
  cells: HeatmapCell[];
  /** Ordered risk levels present in this heatmap */
  buckets: RiskLevel[];
  /** Count per bucket */
  bucketCounts: Record<RiskLevel, number>;
}

const ALL_LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low', 'minimal'];

/**
 * Build a heatmap data structure from a caseload.
 * Cells are ordered critical → minimal, then by riskScore desc within each bucket.
 */
export function buildRiskHeatmap(members: CaseloadMember[]): RiskHeatmap {
  const bucketCounts: Record<RiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    minimal: 0,
  };

  // Group by risk level
  const grouped: Record<RiskLevel, CaseloadMember[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    minimal: [],
  };

  for (const m of members) {
    grouped[m.riskLevel].push(m);
    bucketCounts[m.riskLevel] += 1;
  }

  // Sort within each bucket by riskScore desc
  for (const level of ALL_LEVELS) {
    grouped[level].sort((a, b) => b.riskScore - a.riskScore);
  }

  const cells: HeatmapCell[] = [];
  for (const level of ALL_LEVELS) {
    for (const m of grouped[level]) {
      cells.push({
        memberId: m.id,
        displayName: `${m.firstName} ${m.lastName[0]}.`,
        riskLevel: level,
        riskScore: m.riskScore,
        color: getRiskColor(level),
        label: `${m.firstName} ${m.lastName} — ${level} (${m.riskScore})`,
      });
    }
  }

  const buckets = ALL_LEVELS.filter((l) => bucketCounts[l] > 0);

  return { cells, buckets, bucketCounts };
}

/**
 * Classify a raw numeric score (0–100) into a RiskLevel bucket.
 * Useful when ingesting scores from external risk assessment tools.
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'minimal';
}
