/**
 * State-rules loader — reads state-rules-data.json at module load and
 * exposes helpers for fetching a state's deadline rule set with FED
 * fallback. Adding a new state is a data-file PR, not a code change.
 */

import rawData from './state-rules-data.json';

export type Urgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ReleaseType =
  | 'PAROLE'
  | 'PROBATION'
  | 'SUPERVISED_RELEASE'
  | 'UNCONDITIONAL';

export type DeadlineCategory =
  | 'PAROLE'
  | 'ID_DOCUMENTS'
  | 'BENEFITS'
  | 'HEALTHCARE'
  | 'HOUSING'
  | 'EMPLOYMENT'
  | 'COURT';

export interface LoaderRule {
  id: string;
  category: DeadlineCategory;
  title: string;
  description: string;
  daysAfterRelease: number;
  urgency: Urgency;
  applicableReleaseTypes: ReleaseType[];
  cascadesTo: string[];
  agencyContact: string | null;
  reincarcerationRisk: boolean;
}

type RawRegistry = Record<string, unknown[]>;

const REGISTRY = rawData as unknown as RawRegistry;

/**
 * Runtime shape check for a single rule. We don't use zod here to keep
 * this loader dependency-free; each field is validated individually so
 * a bad record names the exact offending state + rule id.
 */
export function validateRule(state: string, raw: unknown): LoaderRule {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`[state-loader] ${state}: rule is not an object`);
  }
  const r = raw as Record<string, unknown>;
  const str = (k: string): string => {
    if (typeof r[k] !== 'string') {
      throw new Error(`[state-loader] ${state}.${r.id ?? '?'}: field '${k}' must be string`);
    }
    return r[k] as string;
  };
  const num = (k: string): number => {
    if (typeof r[k] !== 'number') {
      throw new Error(`[state-loader] ${state}.${r.id ?? '?'}: field '${k}' must be number`);
    }
    return r[k] as number;
  };
  const bool = (k: string): boolean => {
    if (typeof r[k] !== 'boolean') {
      throw new Error(`[state-loader] ${state}.${r.id ?? '?'}: field '${k}' must be boolean`);
    }
    return r[k] as boolean;
  };
  const arr = (k: string): string[] => {
    if (!Array.isArray(r[k])) {
      throw new Error(`[state-loader] ${state}.${r.id ?? '?'}: field '${k}' must be array`);
    }
    return r[k] as string[];
  };

  const urgency = str('urgency') as Urgency;
  if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(urgency)) {
    throw new Error(`[state-loader] ${state}.${r.id}: invalid urgency '${urgency}'`);
  }
  const category = str('category') as DeadlineCategory;

  return {
    id: str('id'),
    category,
    title: str('title'),
    description: str('description'),
    daysAfterRelease: num('daysAfterRelease'),
    urgency,
    applicableReleaseTypes: arr('applicableReleaseTypes') as ReleaseType[],
    cascadesTo: arr('cascadesTo'),
    agencyContact: r.agencyContact == null ? null : String(r.agencyContact),
    reincarcerationRisk: bool('reincarcerationRisk'),
  };
}

/**
 * Load rules for a given state. Falls back to FED if the state is absent.
 */
export function loadStateRules(stateCode: string): LoaderRule[] {
  const code = stateCode.toUpperCase();
  const raw = REGISTRY[code] ?? REGISTRY['FED'] ?? [];
  return raw.map((r) => validateRule(code, r));
}

/**
 * List all state codes for which we have a rule set.
 */
export function getSupportedStates(): string[] {
  return Object.keys(REGISTRY).sort();
}

/**
 * Total count across all states — useful for health-check endpoints.
 */
export function getRegistryStats(): { states: number; totalRules: number } {
  const states = Object.keys(REGISTRY).length;
  let totalRules = 0;
  for (const arr of Object.values(REGISTRY)) {
    if (Array.isArray(arr)) totalRules += arr.length;
  }
  return { states, totalRules };
}
