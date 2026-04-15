/**
 * Fair-Chance Employer Database
 * Real employers known to hire people with records, seeded with 25 entries.
 * Source: Fair Chance Business Pledge, 70MillionJobs research, NELP data.
 */

export type ConvictionType =
  | 'violent'
  | 'sexual'
  | 'drug'
  | 'property'
  | 'white-collar'
  | 'traffic'
  | 'other';

export type ConvictionPolicy =
  | 'ban-the-box'
  | 'fair-chance'
  | 'unrestricted'
  | 'case-by-case';

export interface FairChanceEmployer {
  id: string;
  name: string;
  industry:
    | 'warehousing'
    | 'construction'
    | 'hospitality'
    | 'tech'
    | 'food-service'
    | 'retail'
    | 'healthcare'
    | 'transportation'
    | 'manufacturing'
    | 'nonprofit';
  /** Two-letter state code, or 'NATIONAL' for nationwide employers */
  state: string;
  convictionPolicy: ConvictionPolicy;
  /** Conviction types this employer will NOT consider — empty means all welcome */
  excludedConvictions: ConvictionType[];
  remoteOk: boolean;
  hiringUrl?: string;
  notes?: string;
}

export const FAIR_CHANCE_EMPLOYERS: FairChanceEmployer[] = [
  {
    id: 'dave-thomas-foundation',
    name: "Wendy's (Dave Thomas Foundation Fair Chance)",
    industry: 'food-service',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual'],
    remoteOk: false,
    hiringUrl: 'https://www.wendys.com/careers',
    notes: 'Dave Thomas Foundation Fair Chance Pledge signatory. Franchise locations vary.',
  },
  {
    id: 'mcdonalds-national',
    name: "McDonald's",
    industry: 'food-service',
    state: 'NATIONAL',
    convictionPolicy: 'ban-the-box',
    excludedConvictions: ['sexual'],
    remoteOk: false,
    hiringUrl: 'https://careers.mcdonalds.com',
    notes: 'Corporate locations follow ban-the-box; franchise policies vary by owner.',
  },
  {
    id: 'amazon-national',
    name: 'Amazon Fulfillment Centers',
    industry: 'warehousing',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://www.amazondelivers.jobs',
    notes: 'Fair Chance Business Pledge signatory. Background check post-offer.',
  },
  {
    id: 'jpmorgan-chase',
    name: 'JPMorgan Chase',
    industry: 'tech',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['white-collar', 'sexual'],
    remoteOk: true,
    hiringUrl: 'https://careers.jpmorgan.com',
    notes: 'Fair Chance Business Pledge signatory. Evaluates on case-by-case for financial roles.',
  },
  {
    id: 'walmart-national',
    name: 'Walmart',
    industry: 'retail',
    state: 'NATIONAL',
    convictionPolicy: 'ban-the-box',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://careers.walmart.com',
    notes: 'Removed conviction question from initial application in 2019.',
  },
  {
    id: 'homeboy-industries-ca',
    name: 'Homeboy Industries',
    industry: 'food-service',
    state: 'CA',
    convictionPolicy: 'unrestricted',
    excludedConvictions: [],
    remoteOk: false,
    hiringUrl: 'https://homeboyindustries.org/get-help/jobs/',
    notes: 'Mission-driven employer. Specifically serves formerly incarcerated individuals.',
  },
  {
    id: 'ceo-new-york',
    name: 'Center for Employment Opportunities (CEO)',
    industry: 'nonprofit',
    state: 'NY',
    convictionPolicy: 'unrestricted',
    excludedConvictions: [],
    remoteOk: false,
    hiringUrl: 'https://ceoworks.org',
    notes: 'Transitional employment specifically for people recently released from incarceration.',
  },
  {
    id: 'greyston-bakery-ny',
    name: 'Greyston Bakery',
    industry: 'food-service',
    state: 'NY',
    convictionPolicy: 'unrestricted',
    excludedConvictions: [],
    remoteOk: false,
    hiringUrl: 'https://greyston.org/open-hiring/',
    notes: 'Open Hiring model — no background check, no interview required.',
  },
  {
    id: 'dave-buster-national',
    name: "Dave & Buster's",
    industry: 'hospitality',
    state: 'NATIONAL',
    convictionPolicy: 'case-by-case',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://www.daveandbusters.com/us/en/careers',
    notes: 'Fair Chance Business Pledge signatory.',
  },
  {
    id: 'turner-construction',
    name: 'Turner Construction',
    industry: 'construction',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual'],
    remoteOk: false,
    hiringUrl: 'https://www.turnerconstruction.com/careers',
    notes: 'Fair Chance Business Pledge signatory. Active in workforce development programs.',
  },
  {
    id: 'recidiviz-tech',
    name: 'Recidiviz',
    industry: 'tech',
    state: 'NATIONAL',
    convictionPolicy: 'unrestricted',
    excludedConvictions: [],
    remoteOk: true,
    hiringUrl: 'https://recidiviz.org/careers',
    notes: 'Justice-tech nonprofit. Actively recruits justice-involved individuals.',
  },
  {
    id: 'marriott-national',
    name: 'Marriott International',
    industry: 'hospitality',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://jobs.marriott.com',
    notes: 'Fair Chance Business Pledge signatory. Hospitality roles across all states.',
  },
  {
    id: 'hilton-national',
    name: 'Hilton Hotels',
    industry: 'hospitality',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://jobs.hilton.com',
    notes: 'Fair Chance Business Pledge signatory.',
  },
  {
    id: 'pcc-community-markets-wa',
    name: 'PCC Community Markets',
    industry: 'retail',
    state: 'WA',
    convictionPolicy: 'ban-the-box',
    excludedConvictions: ['sexual'],
    remoteOk: false,
    hiringUrl: 'https://www.pccmarkets.com/careers/',
    notes: 'Washington state ban-the-box compliant. Cooperative grocery chain.',
  },
  {
    id: 'dismas-charities-national',
    name: 'Dismas Charities',
    industry: 'nonprofit',
    state: 'NATIONAL',
    convictionPolicy: 'unrestricted',
    excludedConvictions: [],
    remoteOk: false,
    hiringUrl: 'https://dismas.com/employment/',
    notes: 'Operates halfway houses. Hires residents and formerly incarcerated staff.',
  },
  {
    id: 'goodwill-national',
    name: 'Goodwill Industries',
    industry: 'nonprofit',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual'],
    remoteOk: false,
    hiringUrl: 'https://www.goodwill.org/jobs-training/find-a-job/',
    notes: 'Mission-driven. Many locations specifically recruit justice-involved individuals.',
  },
  {
    id: 'caterpillar-il',
    name: 'Caterpillar Inc.',
    industry: 'manufacturing',
    state: 'IL',
    convictionPolicy: 'case-by-case',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://careers.caterpillar.com',
    notes: 'Fair Chance Business Pledge signatory. Manufacturing and assembly roles.',
  },
  {
    id: 'uber-freight-national',
    name: 'Uber Freight',
    industry: 'transportation',
    state: 'NATIONAL',
    convictionPolicy: 'case-by-case',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://www.uberfreight.com/carriers/',
    notes: 'CDL required. Drug convictions reviewed case-by-case per DOT rules.',
  },
  {
    id: 'johns-hopkins-md',
    name: 'Johns Hopkins Health System',
    industry: 'healthcare',
    state: 'MD',
    convictionPolicy: 'ban-the-box',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://jobs.hopkinsmedicine.org',
    notes: 'Maryland ban-the-box law applies. Non-clinical roles most accessible.',
  },
  {
    id: 'dave-thomas-ga',
    name: "Waffle House",
    industry: 'food-service',
    state: 'GA',
    convictionPolicy: 'case-by-case',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://www.wafflehouse.com/employment/',
    notes: 'Georgia-headquartered. Known for second-chance hiring in Southeast.',
  },
  {
    id: 'shaw-industries-ga',
    name: 'Shaw Industries',
    industry: 'manufacturing',
    state: 'GA',
    convictionPolicy: 'case-by-case',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://careers.shawinc.com',
    notes: 'Georgia-based flooring manufacturer. Active in workforce reentry programs.',
  },
  {
    id: 'fedex-national',
    name: 'FedEx Ground',
    industry: 'transportation',
    state: 'NATIONAL',
    convictionPolicy: 'case-by-case',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://careers.fedex.com',
    notes: 'Package handler and warehouse roles. Background check post-offer.',
  },
  {
    id: 'target-national',
    name: 'Target Corporation',
    industry: 'retail',
    state: 'NATIONAL',
    convictionPolicy: 'ban-the-box',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://corporate.target.com/careers',
    notes: 'Removed conviction question from application. Background check post-offer.',
  },
  {
    id: 'starbucks-national',    name: 'Starbucks',
    industry: 'food-service',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual', 'violent'],
    remoteOk: false,
    hiringUrl: 'https://www.starbucks.com/careers/',
    notes: 'Fair Chance Business Pledge signatory. 100-Cities initiative for reentry hiring.',
  },
  {
    id: 'laborers-union-national',
    name: 'LIUNA (Laborers International Union)',
    industry: 'construction',
    state: 'NATIONAL',
    convictionPolicy: 'fair-chance',
    excludedConvictions: ['sexual'],
    remoteOk: false,
    hiringUrl: 'https://www.liuna.org/members/find-a-job',
    notes: 'Union apprenticeship programs. Many locals have reentry partnerships.',
  },
];

/**
 * Returns employers available in a given state (including NATIONAL employers)
 * that do not exclude any of the applicant's conviction types.
 *
 * @param state - Two-letter US state code (e.g. 'GA')
 * @param convictions - Array of conviction types the applicant has
 */
export function getEmployersByState(
  state: string,
  convictions: ConvictionType[]
): FairChanceEmployer[] {
  const upperState = state.toUpperCase();
  return FAIR_CHANCE_EMPLOYERS.filter((employer) => {
    const stateMatch =
      employer.state === 'NATIONAL' || employer.state === upperState;
    if (!stateMatch) return false;

    // Exclude employer if any of the applicant's convictions are in their exclusion list
    const hasExcludedConviction = convictions.some((c) =>
      employer.excludedConvictions.includes(c)
    );
    return !hasExcludedConviction;
  });
}
