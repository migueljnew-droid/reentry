/**
 * Conviction-Aware Employment Matcher
 *
 * Pure function — no I/O, no side effects.
 * Ranks fair-chance employers by eligibility score for a given user profile.
 */

import {
  type ConvictionType,
  type FairChanceEmployer,
  getEmployersByState,
} from './fair-chance-db';
import { getBanTheBoxProtection, type StateBanTheBoxRule } from './ban-the-box';

export interface EmployerMatchProfile {
  /** Two-letter US state code */
  state: string;
  /** Conviction types the applicant has */
  convictions: ConvictionType[];
  /** Whether the applicant can work remotely */
  remoteOk: boolean;
  /** Optional: filter to specific industries */
  industries?: FairChanceEmployer['industry'][];
}

export interface EmployerMatch {
  employer: FairChanceEmployer;
  /** 0–100 eligibility score */
  score: number;
  /** Human-readable explanation of why this employer is a match */
  explanation: string;
  /** The ban-the-box rule protecting this applicant in their state */
  banTheBoxProtection: StateBanTheBoxRule;
  /** Specific hiring tips for this employer given the applicant's profile */
  tips: string[];
}

export interface MatchResult {
  matches: EmployerMatch[];
  totalFound: number;
  banTheBoxProtection: StateBanTheBoxRule;
  /** Summary message for voice-first delivery */
  voiceSummary: string;
}

// Score weights
const POLICY_SCORES: Record<FairChanceEmployer['convictionPolicy'], number> = {
  unrestricted: 100,
  'fair-chance': 85,
  'ban-the-box': 75,
  'case-by-case': 55,
};

const TIMING_BONUS: Record<StateBanTheBoxRule['backgroundCheckTiming'], number> = {
  'post-offer': 10,
  'post-interview': 5,
  'pre-offer': 0,
};

function buildExplanation(
  employer: FairChanceEmployer,
  profile: EmployerMatchProfile,
  btbRule: StateBanTheBoxRule
): string {
  const policyLabel: Record<FairChanceEmployer['convictionPolicy'], string> = {
    unrestricted: 'hires without any conviction restrictions',
    'fair-chance': 'is a Fair Chance employer and evaluates applicants individually',
    'ban-the-box': 'does not ask about convictions on the initial application',
    'case-by-case': 'reviews conviction history on a case-by-case basis',
  };

  const parts: string[] = [
    `${employer.name} ${policyLabel[employer.convictionPolicy]}.`,
  ];

  if (employer.state === 'NATIONAL') {
    parts.push('They hire nationwide.');
  } else {
    parts.push(`They operate in ${employer.state}.`);
  }

  if (employer.remoteOk && profile.remoteOk) {
    parts.push('Remote work is available.');
  }

  if (btbRule.level !== 'none') {
    parts.push(
      `Your state (${profile.state}) has ban-the-box protections: ${btbRule.summary}`
    );
  }

  if (employer.notes) {
    parts.push(employer.notes);
  }

  return parts.join(' ');
}

function buildTips(
  employer: FairChanceEmployer,
  profile: EmployerMatchProfile,
  btbRule: StateBanTheBoxRule
): string[] {
  const tips: string[] = [];

  if (employer.convictionPolicy === 'case-by-case') {
    tips.push(
      'Prepare a brief, honest statement about your conviction and what you have done since — employers respond well to accountability and growth.'
    );
  }

  if (btbRule.backgroundCheckTiming === 'post-offer') {
    tips.push(
      'In your state, employers can only run a background check after making you a conditional job offer. You have the right to discuss your record at that point.'
    );
  } else if (btbRule.backgroundCheckTiming === 'post-interview') {
    tips.push(
      'In your state, employers cannot ask about your record until after the first interview. Focus on your skills and experience first.'
    );
  }

  if (profile.convictions.includes('drug') && employer.excludedConvictions.length === 0) {
    tips.push(
      'This employer does not exclude drug convictions. Mentioning any recovery program or sobriety can strengthen your application.'
    );
  }

  if (employer.hiringUrl) {
    tips.push(`Apply directly at: ${employer.hiringUrl}`);
  }

  if (employer.industry === 'construction' || employer.industry === 'manufacturing') {
    tips.push(
      'Trades and manufacturing roles often value reliability and physical capability over background — highlight any relevant skills or certifications.'
    );
  }

  if (employer.industry === 'nonprofit') {
    tips.push(
      'Nonprofit employers in reentry often value lived experience. Your personal story can be an asset, not a liability.'
    );
  }

  return tips;
}

function scoreEmployer(
  employer: FairChanceEmployer,
  profile: EmployerMatchProfile,
  btbRule: StateBanTheBoxRule
): number {
  let score = POLICY_SCORES[employer.convictionPolicy];

  // Bonus for state-level legal protection
  if (btbRule.level === 'both') score += TIMING_BONUS[btbRule.backgroundCheckTiming];
  else if (btbRule.level === 'private') score += TIMING_BONUS[btbRule.backgroundCheckTiming];

  // Bonus for remote match
  if (employer.remoteOk && profile.remoteOk) score += 5;

  // Bonus for state-specific employer (more likely to be accessible)
  if (employer.state !== 'NATIONAL') score += 3;

  // Penalty for case-by-case with violent/sexual convictions (higher uncertainty)
  if (
    employer.convictionPolicy === 'case-by-case' &&
    profile.convictions.some((c) => c === 'violent' || c === 'sexual')
  ) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Match employers to a user profile.
 * Returns ranked matches with scores, explanations, and ban-the-box context.
 */
export function matchEmployers(profile: EmployerMatchProfile): MatchResult {
  const btbRule = getBanTheBoxProtection(profile.state);

  let eligible = getEmployersByState(profile.state, profile.convictions);

  // Filter by industry preference if provided
  if (profile.industries && profile.industries.length > 0) {
    eligible = eligible.filter((e) => profile.industries!.includes(e.industry));
  }

  // Filter remote-only if user cannot work remotely
  // (keep all employers — remote is a bonus, not a requirement)

  const matches: EmployerMatch[] = eligible
    .map((employer) => ({
      employer,
      score: scoreEmployer(employer, profile, btbRule),
      explanation: buildExplanation(employer, profile, btbRule),
      banTheBoxProtection: btbRule,
      tips: buildTips(employer, profile, btbRule),
    }))
    .sort((a, b) => b.score - a.score);

  const voiceSummary = buildVoiceSummary(matches, btbRule, profile);

  return {
    matches,
    totalFound: matches.length,
    banTheBoxProtection: btbRule,
    voiceSummary,
  };
}

function buildVoiceSummary(
  matches: EmployerMatch[],
  btbRule: StateBanTheBoxRule,
  profile: EmployerMatchProfile
): string {
  if (matches.length === 0) {
    return (
      'We did not find any employers in our database that match your profile right now. ' +
      'Contact your local workforce development center or legal aid office for personalized help.'
    );
  }

  const topEmployer = matches[0].employer.name;
  const protectionNote =
    btbRule.level !== 'none'
      ? `Good news — ${profile.state} has ban-the-box protections, which means employers cannot ask about your record on the initial application. `
      : '';

  return (
    `We found ${matches.length} employer${matches.length === 1 ? '' : 's'} that may hire you. ` +
    `${protectionNote}` +
    `Your top match is ${topEmployer}. ` +
    `I will walk you through how to apply.`
  );
}
