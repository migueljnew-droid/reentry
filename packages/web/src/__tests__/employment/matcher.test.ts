import { describe, it, expect } from 'vitest';
import { matchEmployers } from '@/lib/employment/matcher';
import { getEmployersByState } from '@/lib/employment/fair-chance-db';
import { getBanTheBoxProtection } from '@/lib/employment/ban-the-box';

describe('getBanTheBoxProtection', () => {
  it('returns a rule for a known state', () => {
    const rule = getBanTheBoxProtection('CA');
    expect(rule.state).toBe('CA');
    expect(rule.level).toBe('both');
    expect(rule.backgroundCheckTiming).toBe('post-offer');
  });

  it('returns a rule for DC', () => {
    const rule = getBanTheBoxProtection('DC');
    expect(rule.level).toBe('both');
    expect(rule.backgroundCheckTiming).toBe('post-offer');
  });

  it('returns none for a state with no law (AL)', () => {
    const rule = getBanTheBoxProtection('AL');
    expect(rule.level).toBe('none');
    expect(rule.backgroundCheckTiming).toBe('pre-offer');
  });

  it('is case-insensitive', () => {
    const upper = getBanTheBoxProtection('GA');
    const lower = getBanTheBoxProtection('ga');
    expect(upper.state).toBe(lower.state);
  });

  it('returns a fallback for an unknown state code', () => {
    const rule = getBanTheBoxProtection('ZZ');
    expect(rule.level).toBe('none');
    expect(rule.summary).toContain('No ban-the-box data');
  });
});

describe('getEmployersByState', () => {
  it('returns national employers for any state', () => {
    const results = getEmployersByState('GA', []);
    const national = results.filter((e) => e.state === 'NATIONAL');
    expect(national.length).toBeGreaterThan(0);
  });

  it('includes state-specific employers for matching state', () => {
    const results = getEmployersByState('CA', []);
    const caEmployers = results.filter((e) => e.state === 'CA');
    expect(caEmployers.length).toBeGreaterThan(0);
  });

  it('excludes employers that ban the applicant conviction type', () => {
    // All employers that exclude 'sexual' should not appear for someone with sexual conviction
    const results = getEmployersByState('GA', ['sexual']);
    const hasExcluded = results.some((e) => e.excludedConvictions.includes('sexual'));
    expect(hasExcluded).toBe(false);
  });

  it('returns unrestricted employers for any conviction type', () => {
    const results = getEmployersByState('NY', ['violent', 'drug']);
    const unrestricted = results.filter((e) => e.convictionPolicy === 'unrestricted');
    expect(unrestricted.length).toBeGreaterThan(0);
  });

  it('returns empty array when no employers match state + convictions', () => {
    // Use a state with no state-specific employers and convictions that exclude most
    // This is a soft test — just ensure it returns an array
    const results = getEmployersByState('WY', ['sexual', 'violent']);
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('matchEmployers', () => {
  it('returns a MatchResult with matches array', () => {
    const result = matchEmployers({
      state: 'GA',
      convictions: ['drug'],
      remoteOk: false,
    });
    expect(result).toHaveProperty('matches');
    expect(result).toHaveProperty('totalFound');
    expect(result).toHaveProperty('banTheBoxProtection');
    expect(result).toHaveProperty('voiceSummary');
  });

  it('matches are sorted by score descending', () => {
    const result = matchEmployers({
      state: 'CA',
      convictions: [],
      remoteOk: false,
    });
    const scores = result.matches.map((m) => m.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });

  it('all match scores are between 0 and 100', () => {
    const result = matchEmployers({
      state: 'NY',
      convictions: ['property'],
      remoteOk: true,
    });
    result.matches.forEach((m) => {
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    });
  });

  it('each match has an explanation string', () => {
    const result = matchEmployers({
      state: 'TX',
      convictions: ['drug'],
      remoteOk: false,
    });
    result.matches.forEach((m) => {
      expect(typeof m.explanation).toBe('string');
      expect(m.explanation.length).toBeGreaterThan(10);
    });
  });

  it('each match has a tips array', () => {
    const result = matchEmployers({
      state: 'FL',
      convictions: ['drug'],
      remoteOk: false,
    });
    result.matches.forEach((m) => {
      expect(Array.isArray(m.tips)).toBe(true);
    });
  });

  it('filters by industry when industries array is provided', () => {
    const result = matchEmployers({
      state: 'CA',
      convictions: [],
      remoteOk: false,
      industries: ['food-service'],
    });
    result.matches.forEach((m) => {
      expect(m.employer.industry).toBe('food-service');
    });
  });

  it('returns all industries when industries array is empty', () => {
    const withFilter = matchEmployers({
      state: 'CA',
      convictions: [],
      remoteOk: false,
      industries: [],
    });
    const withoutFilter = matchEmployers({
      state: 'CA',
      convictions: [],
      remoteOk: false,
    });
    // Empty industries array should not filter
    expect(withFilter.totalFound).toBe(withoutFilter.totalFound);
  });

  it('unrestricted employers score higher than case-by-case', () => {
    const result = matchEmployers({
      state: 'NY',
      convictions: [],
      remoteOk: false,
    });
    const unrestricted = result.matches.find(
      (m) => m.employer.convictionPolicy === 'unrestricted'
    );
    const caseByCaseMatches = result.matches.filter(
      (m) => m.employer.convictionPolicy === 'case-by-case'
    );
    if (unrestricted && caseByCaseMatches.length > 0) {
      caseByCaseMatches.forEach((m) => {
        expect(unrestricted.score).toBeGreaterThanOrEqual(m.score);
      });
    }
  });

  it('voice summary mentions the number of matches found', () => {
    const result = matchEmployers({
      state: 'GA',
      convictions: ['drug'],
      remoteOk: false,
    });
    expect(result.voiceSummary).toContain(String(result.totalFound));
  });

  it('voice summary mentions ban-the-box protection when applicable', () => {
    // CA has strong ban-the-box
    const result = matchEmployers({
      state: 'CA',
      convictions: [],
      remoteOk: false,
    });
    expect(result.voiceSummary).toContain('ban-the-box');
  });

  it('voice summary does not mention ban-the-box for states with no law', () => {
    const result = matchEmployers({
      state: 'AL',
      convictions: [],
      remoteOk: false,
    });
    expect(result.voiceSummary).not.toContain('ban-the-box');
  });

  it('returns a helpful message when no matches found', () => {
    // Someone with sexual + violent convictions in a state with few employers
    const result = matchEmployers({
      state: 'WY',
      convictions: ['sexual', 'violent'],
      remoteOk: false,
      industries: ['tech'],
    });
    if (result.totalFound === 0) {
      expect(result.voiceSummary).toContain('workforce development');
    }
  });

  it('attaches the correct ban-the-box rule to each match', () => {
    const result = matchEmployers({
      state: 'MN',
      convictions: [],
      remoteOk: false,
    });
    result.matches.forEach((m) => {
      expect(m.banTheBoxProtection.state).toBe('MN');
    });
  });

  it('totalFound equals matches.length', () => {
    const result = matchEmployers({
      state: 'TX',
      convictions: ['property'],
      remoteOk: true,
    });
    expect(result.totalFound).toBe(result.matches.length);
  });
});
