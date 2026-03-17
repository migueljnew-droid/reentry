import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const { state, convictionType, skills } = await req.json();

  // Load national + state-specific employer data
  let employers: Array<Record<string, unknown>> = [];
  try {
    const nationalPath = path.join(process.cwd(), '..', '..', 'data', 'employers', 'national.json');
    const raw = await fs.readFile(nationalPath, 'utf-8');
    const data = JSON.parse(raw);
    employers = data.employers || [];
  } catch {
    employers = getHardcodedEmployers();
  }

  // Load state-specific employers
  if (state) {
    try {
      const statePath = path.join(process.cwd(), '..', '..', 'data', 'employers', `${state}.json`);
      const stateRaw = await fs.readFile(statePath, 'utf-8');
      const stateData = JSON.parse(stateRaw);
      // State employers go FIRST (more relevant)
      employers = [...(stateData.localEmployers || []), ...employers];
    } catch {
      // No state-specific data — national only
    }
  }

  // Filter by conviction type restrictions
  const filtered = employers.map((emp) => {
    const restrictions = (emp.restrictions as string[]) || [];
    const isRestricted = restrictions.some((r) => {
      const rLower = r.toLowerCase();
      if (convictionType === 'sex_offense' && rLower.includes('sex')) return true;
      if (convictionType === 'dui' && rLower.includes('dui')) return true;
      if (convictionType === 'violent' && rLower.includes('violent')) return true;
      return false;
    });

    return {
      ...emp,
      matchScore: isRestricted ? 0.3 : 0.8 + Math.random() * 0.2,
      restricted: isRestricted,
      restrictionNote: isRestricted ? restrictions.join('; ') : null,
    };
  });

  // Sort by match score (best matches first)
  filtered.sort((a, b) => (b.matchScore as number) - (a.matchScore as number));

  return NextResponse.json({
    state,
    convictionType,
    totalEmployers: filtered.length,
    matches: filtered,
  });
}

function getHardcodedEmployers() {
  return [
    { name: 'Amazon', industry: 'Warehousing', positions: ['Warehouse Associate', 'Delivery Driver'], payRange: '$17-23/hr', convictionPolicy: 'Case-by-case. Ban the Box.', restrictions: ['No sex offenses for delivery'], banTheBox: true, applyUrl: 'https://hiring.amazon.com', locations: 'Nationwide', benefits: 'Health day 1, 401k, tuition (Career Choice)', notes: 'Largest private employer. Very felon-friendly.' },
    { name: 'Walmart', industry: 'Retail', positions: ['Store Associate', 'Stocker'], payRange: '$14-19/hr', convictionPolicy: 'Removed conviction question in 2018.', restrictions: ['No violent felony within 7yr for customer roles'], banTheBox: true, applyUrl: 'https://careers.walmart.com', locations: 'Nationwide (4,700+ stores)', benefits: '$1/day college degree', notes: 'Second largest employer.' },
    { name: 'FedEx Ground', industry: 'Logistics', positions: ['Package Handler', 'Warehouse Worker'], payRange: '$16-22/hr', convictionPolicy: 'Considers records. Background after offer.', restrictions: ['No DUI within 3yr for driving'], banTheBox: true, applyUrl: 'https://careers.fedex.com', locations: 'Nationwide', benefits: 'Tuition reimbursement', notes: 'Night shift high demand.' },
    { name: 'UPS', industry: 'Logistics', positions: ['Package Handler', 'Driver Helper'], payRange: '$16-21/hr + union', convictionPolicy: 'Fair chance employer.', restrictions: ['DUI for driving only'], banTheBox: true, applyUrl: 'https://www.jobs-ups.com', locations: 'Nationwide', benefits: 'Teamsters union, $25K tuition', notes: 'Union job — strong protections.' },
    { name: 'Home Depot', industry: 'Retail', positions: ['Sales Associate', 'Lot Associate', 'Freight'], payRange: '$15-20/hr', convictionPolicy: 'Case-by-case after conditional offer.', restrictions: ['Theft for cashier'], banTheBox: true, applyUrl: 'https://careers.homedepot.com', locations: 'Nationwide (2,300+ stores)', benefits: 'Stock purchase, tuition', notes: 'Trades experience valued.' },
    { name: 'Waste Management', industry: 'Waste Services', positions: ['CDL Driver', 'Helper', 'Maintenance'], payRange: '$18-28/hr', convictionPolicy: 'Actively recruits returning citizens.', restrictions: ['Valid CDL for drivers', 'No DUI within 5yr'], banTheBox: true, applyUrl: 'https://careers.wm.com', locations: 'Nationwide', benefits: 'CDL training, overtime', notes: 'Most felon-friendly. Partners with reentry orgs.' },
    { name: 'Tyson Foods', industry: 'Food Processing', positions: ['Production Worker', 'Forklift Operator'], payRange: '$16-24/hr', convictionPolicy: 'Fair chance. All applicants considered.', restrictions: ['Minimal'], banTheBox: true, applyUrl: 'https://www.tysonfoods.com/careers', locations: '25+ states', benefits: 'ESL, citizenship help, tuition', notes: 'Very felon-friendly. Overtime common.' },
    { name: 'Goodwill Industries', industry: 'Retail / Training', positions: ['Retail Associate', 'Warehouse', 'Job Coach'], payRange: '$13-18/hr', convictionPolicy: 'Mission is overcoming employment barriers.', restrictions: ['Very few'], banTheBox: true, applyUrl: 'https://www.goodwill.org/jobs-training/', locations: 'Nationwide (3,300+)', benefits: 'Job training, GED, career coaching', notes: 'Best first job after release. Free job training.' },
    { name: 'Construction / Trades', industry: 'Construction', positions: ['Laborer', 'Apprentice', 'Demolition'], payRange: '$16-30/hr', convictionPolicy: '#1 employer of returning citizens. Most don\'t background check laborers.', restrictions: ['Govt contract jobs may need clearance'], banTheBox: true, applyUrl: 'Search local union hall or construction jobs', locations: 'Everywhere', benefits: 'Overtime, union apprenticeships → $50-80K+', notes: 'BEST path. Unions have apprenticeship programs for returning citizens.' },
    { name: 'Staffing Agencies', industry: 'Staffing', positions: ['Warehouse', 'Manufacturing', 'Janitorial'], payRange: '$14-20/hr', convictionPolicy: 'Many specialize in placing people with records.', restrictions: ['Varies'], banTheBox: true, applyUrl: 'PeopleReady, Kelly Services, Manpower, Aerotek', locations: 'Nationwide', benefits: 'Fast placement (same week), same-day pay (PeopleReady)', notes: 'Walk into any PeopleReady branch with ID. Same-day work available.' },
    { name: 'Dave\'s Hot Chicken', industry: 'Food Service', positions: ['Crew Member', 'Shift Lead'], payRange: '$14-19/hr', convictionPolicy: 'Proud second-chance employer. Partners with Homeboy Industries.', restrictions: ['None'], banTheBox: true, applyUrl: 'https://www.daveshotchicken.com/careers', locations: 'Expanding (800+ planned)', benefits: 'Flexible scheduling, advancement', notes: 'Second-chance hiring is core value.' },
    { name: 'Koch Industries / Georgia-Pacific', industry: 'Manufacturing', positions: ['Production Operator', 'Machine Operator'], payRange: '$18-26/hr', convictionPolicy: 'Ban the Box leader since 2015.', restrictions: ['Safety-sensitive only'], banTheBox: true, applyUrl: 'https://jobs.kochcareers.com', locations: 'Nationwide (Southeast focus)', benefits: 'Profit sharing, 401k', notes: 'Charles Koch advocates second-chance hiring.' },
  ];
}
