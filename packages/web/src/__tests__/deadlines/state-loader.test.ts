import { describe, it, expect } from 'vitest';
import {
  loadStateRules,
  getSupportedStates,
  getRegistryStats,
  validateRule,
} from '@/lib/deadlines/state-loader';

describe('state-loader', () => {
  it('supports all 50 states + DC + FED', () => {
    const states = getSupportedStates();
    expect(states).toHaveLength(52);
    expect(states).toContain('GA');
    expect(states).toContain('CA');
    expect(states).toContain('DC');
    expect(states).toContain('FED');
  });

  it('loads a minimum of 3 rules for any supported state', () => {
    for (const s of getSupportedStates()) {
      const rules = loadStateRules(s);
      expect(rules.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('loads GA rules with agency contact populated for parole', () => {
    const rules = loadStateRules('GA');
    const parole = rules.find((r) => r.category === 'PAROLE');
    expect(parole).toBeDefined();
    expect(parole?.agencyContact).toBeTruthy();
    expect(parole?.reincarcerationRisk).toBe(true);
  });

  it('falls back to FED rules for an unsupported code', () => {
    const rules = loadStateRules('XX');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].id.startsWith('fed-')).toBe(true);
  });

  it('is case-insensitive on state code', () => {
    const ga = loadStateRules('ga');
    const GA = loadStateRules('GA');
    expect(ga.length).toBe(GA.length);
  });

  it('exposes a registry stats summary', () => {
    const stats = getRegistryStats();
    expect(stats.states).toBe(52);
    expect(stats.totalRules).toBeGreaterThanOrEqual(52 * 3);
  });

  it('validateRule throws on missing required fields', () => {
    expect(() => validateRule('GA', { id: 'x' })).toThrow();
  });

  it('validateRule throws on invalid urgency', () => {
    expect(() =>
      validateRule('GA', {
        id: 'x', category: 'PAROLE', title: 't', description: 'd',
        daysAfterRelease: 1, urgency: 'EXTREME', applicableReleaseTypes: [],
        cascadesTo: [], agencyContact: null, reincarcerationRisk: false,
      }),
    ).toThrow(/urgency/);
  });
});
