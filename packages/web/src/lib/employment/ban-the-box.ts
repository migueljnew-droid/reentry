/**
 * Ban-the-Box & Fair Chance Hiring Rules — All 50 States + DC
 *
 * Sources: National Employment Law Project (NELP) "Ban the Box" tracker,
 * SHRM state law summaries, EEOC guidance.
 *
 * Last reviewed: 2024. Laws change — always verify with local legal aid.
 */

export interface StateBanTheBoxRule {
  state: string;
  /** Which sector the law covers */
  level: 'public' | 'private' | 'both' | 'none';
  /** Minimum employees for private-sector coverage; null = no threshold / N/A */
  applicabilityThresholdEmployees: number | null;
  /** When the employer may conduct a background check */
  backgroundCheckTiming: 'post-offer' | 'post-interview' | 'pre-offer';
  /** Human-readable summary of the protection */
  summary: string;
  /** Relevant statute or ordinance citation */
  citation?: string;
}

export const BAN_THE_BOX_RULES: Record<string, StateBanTheBoxRule> = {
  AL: {
    state: 'AL',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'Alabama has no statewide ban-the-box law. No restrictions on when employers may ask about convictions.',
  },
  AK: {
    state: 'AK',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Alaska bans the box for state government employment. Private employers have no restriction.',
    citation: 'Alaska Admin. Order 284 (2017)',
  },
  AZ: {
    state: 'AZ',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Arizona bans the box for state agency employment only.',
    citation: 'AZ Exec. Order 2017-07',
  },
  AR: {
    state: 'AR',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'Arkansas has no statewide ban-the-box law.',
  },
  CA: {
    state: 'CA',
    level: 'both',
    applicabilityThresholdEmployees: 5,
    backgroundCheckTiming: 'post-offer',
    summary: 'California Fair Chance Act covers public and private employers with 5+ employees. Background check only after conditional offer. Individualized assessment required.',
    citation: 'CA Gov. Code § 12952 (AB 2188, 2018)',
  },
  CO: {
    state: 'CO',
    level: 'both',
    applicabilityThresholdEmployees: 11,
    backgroundCheckTiming: 'post-interview',
    summary: 'Colorado bans the box for public employers and private employers with 11+ employees.',
    citation: 'CO HB 19-1025',
  },
  CT: {
    state: 'CT',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-interview',
    summary: 'Connecticut bans the box for all employers. Cannot ask about criminal history on initial application.',
    citation: 'CT Gen. Stat. § 31-51i',
  },
  DE: {
    state: 'DE',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Delaware bans the box for state government employment.',
    citation: 'DE Exec. Order 41 (2014)',
  },
  DC: {
    state: 'DC',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-offer',
    summary: 'DC Fair Criminal Record Screening Act covers all employers. Background check only after conditional offer.',
    citation: 'DC Code § 32-1341 et seq.',
  },
  FL: {
    state: 'FL',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Florida bans the box for state government employment only. No private-sector law.',
    citation: 'FL Exec. Order 19-8',
  },
  GA: {
    state: 'GA',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Georgia bans the box for state government employment. Atlanta city ordinance extends to city contractors.',
    citation: 'GA Exec. Order (2015); Atlanta Code § 2-1374',
  },
  HI: {
    state: 'HI',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-offer',
    summary: 'Hawaii was the first state to ban the box (2010). Covers all employers. Background check only after conditional offer.',
    citation: 'HI Rev. Stat. § 378-2.5',
  },
  ID: {
    state: 'ID',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'Idaho has no statewide ban-the-box law.',
  },
  IL: {
    state: 'IL',
    level: 'both',
    applicabilityThresholdEmployees: 15,
    backgroundCheckTiming: 'post-offer',
    summary: 'Illinois Job Opportunities for Qualified Applicants Act covers employers with 15+ employees. Background check post-offer only.',
    citation: '820 ILCS 75',
  },
  IN: {
    state: 'IN',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Indiana bans the box for state government employment.',
    citation: 'IN Exec. Order 13-13',
  },
  IA: {
    state: 'IA',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Iowa bans the box for state government employment.',
    citation: 'IA Exec. Order 3 (2020)',
  },
  KS: {
    state: 'KS',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Kansas bans the box for state government employment.',
  },
  KY: {
    state: 'KY',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Kentucky bans the box for state government employment.',
    citation: 'KY Exec. Order 2017-426',
  },
  LA: {
    state: 'LA',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Louisiana bans the box for state government employment.',
    citation: 'LA Exec. Order JBE 2016-06',
  },
  ME: {
    state: 'ME',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-interview',
    summary: 'Maine bans the box for all employers. Cannot ask about criminal history before first interview.',
    citation: 'ME Rev. Stat. tit. 5, § 5301',
  },
  MD: {
    state: 'MD',
    level: 'both',
    applicabilityThresholdEmployees: 15,
    backgroundCheckTiming: 'post-interview',
    summary: 'Maryland bans the box for employers with 15+ employees. Background check after first interview.',
    citation: 'MD Code, State Gov. § 20-602',
  },
  MA: {
    state: 'MA',
    level: 'both',
    applicabilityThresholdEmployees: 6,
    backgroundCheckTiming: 'post-interview',
    summary: 'Massachusetts CORI Reform covers employers with 6+ employees. Cannot ask about criminal history on initial application.',
    citation: 'MA Gen. Laws ch. 151B, § 4(9½)',
  },
  MI: {
    state: 'MI',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Michigan bans the box for state government employment.',
    citation: 'MI Exec. Directive 2018-4',
  },
  MN: {
    state: 'MN',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-offer',
    summary: 'Minnesota bans the box for all employers. Background check only after conditional offer.',
    citation: 'MN Stat. § 364.021',
  },
  MS: {
    state: 'MS',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'Mississippi has no statewide ban-the-box law.',
  },
  MO: {
    state: 'MO',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Missouri bans the box for state government employment.',
    citation: 'MO Exec. Order 16-04',
  },
  MT: {
    state: 'MT',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'Montana has no statewide ban-the-box law.',
  },
  NE: {
    state: 'NE',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Nebraska bans the box for state government employment.',
    citation: 'NE Exec. Order 13-03',
  },
  NV: {
    state: 'NV',
    level: 'both',
    applicabilityThresholdEmployees: 15,
    backgroundCheckTiming: 'post-offer',
    summary: 'Nevada bans the box for employers with 15+ employees. Background check post-offer.',
    citation: 'NV Rev. Stat. § 613.133',
  },
  NH: {
    state: 'NH',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'New Hampshire bans the box for state government employment.',
    citation: 'NH Exec. Order 2016-01',
  },
  NJ: {
    state: 'NJ',
    level: 'both',
    applicabilityThresholdEmployees: 15,
    backgroundCheckTiming: 'post-offer',
    summary: 'New Jersey Opportunity to Compete Act covers employers with 15+ employees. Background check post-offer.',
    citation: 'NJ Stat. § 34:6B-14 et seq.',
  },
  NM: {
    state: 'NM',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-offer',
    summary: 'New Mexico bans the box for all employers. Background check post-offer.',
    citation: 'NM Stat. § 28-2-3.1',
  },
  NY: {
    state: 'NY',
    level: 'both',
    applicabilityThresholdEmployees: 10,
    backgroundCheckTiming: 'post-offer',
    summary: 'New York Fair Chance Act covers employers with 10+ employees. Background check post-offer. Individualized assessment required.',
    citation: 'NY Exec. Law § 296(16)',
  },
  NC: {
    state: 'NC',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'North Carolina bans the box for state government employment.',
    citation: 'NC Exec. Order 158 (2017)',
  },
  ND: {
    state: 'ND',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'North Dakota has no statewide ban-the-box law.',
  },
  OH: {
    state: 'OH',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Ohio bans the box for state government employment.',
    citation: 'OH Exec. Order 2015-13K',
  },
  OK: {
    state: 'OK',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'Oklahoma has no statewide ban-the-box law.',
  },
  OR: {
    state: 'OR',
    level: 'both',
    applicabilityThresholdEmployees: 6,
    backgroundCheckTiming: 'post-offer',
    summary: 'Oregon bans the box for employers with 6+ employees. Background check post-offer.',
    citation: 'OR Rev. Stat. § 659A.360',
  },
  PA: {
    state: 'PA',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Pennsylvania bans the box for state government employment. Philadelphia city ordinance extends to private employers.',
    citation: 'PA Exec. Order 2017-01',
  },
  RI: {
    state: 'RI',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-offer',
    summary: 'Rhode Island bans the box for all employers. Background check post-offer.',
    citation: 'RI Gen. Laws § 28-5-7(7)',
  },
  SC: {
    state: 'SC',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'South Carolina has no statewide ban-the-box law.',
  },
  SD: {
    state: 'SD',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'South Dakota has no statewide ban-the-box law.',
  },
  TN: {
    state: 'TN',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Tennessee bans the box for state government employment.',
    citation: 'TN Exec. Order 5 (2016)',
  },
  TX: {
    state: 'TX',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Texas bans the box for state government employment. Austin city ordinance extends to private employers.',
    citation: 'TX Exec. Order GA-02 (2015)',
  },
  UT: {
    state: 'UT',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Utah bans the box for state government employment.',
    citation: 'UT Exec. Order 2017-2',
  },
  VT: {
    state: 'VT',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-offer',
    summary: 'Vermont bans the box for all employers. Background check post-offer.',
    citation: 'VT Stat. tit. 21, § 495j',
  },
  VA: {
    state: 'VA',
    level: 'both',
    applicabilityThresholdEmployees: 1,
    backgroundCheckTiming: 'post-interview',
    summary: 'Virginia bans the box for all employers. Cannot ask about criminal history on initial application.',
    citation: 'VA Code § 19.2-389.3',
  },
  WA: {
    state: 'WA',
    level: 'both',
    applicabilityThresholdEmployees: 8,
    backgroundCheckTiming: 'post-offer',
    summary: 'Washington Fair Chance Act covers employers with 8+ employees. Background check post-offer.',
    citation: 'WA Rev. Code § 49.94.010',
  },
  WV: {
    state: 'WV',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'West Virginia has no statewide ban-the-box law.',
  },
  WI: {
    state: 'WI',
    level: 'public',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'post-interview',
    summary: 'Wisconsin bans the box for state government employment.',
    citation: 'WI Exec. Order 179 (2015)',
  },
  WY: {
    state: 'WY',
    level: 'none',
    applicabilityThresholdEmployees: null,
    backgroundCheckTiming: 'pre-offer',
    summary: 'Wyoming has no statewide ban-the-box law.',
  },
};

/**
 * Returns the ban-the-box rule for a given state.
 * Falls back to a "none" rule if the state is not found.
 */
export function getBanTheBoxProtection(state: string): StateBanTheBoxRule {
  const upperState = state.toUpperCase();
  return (
    BAN_THE_BOX_RULES[upperState] ?? {
      state: upperState,
      level: 'none',
      applicabilityThresholdEmployees: null,
      backgroundCheckTiming: 'pre-offer',
      summary: 'No ban-the-box data available for this state. Consult local legal aid.',
    }
  );
}
