import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { validateRequest } from '@/lib/validate';
import { housingSearchSchema } from '@/lib/schemas';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateRequest(housingSearchSchema, body);
  if (!validated.success) return validated.response;

  const { state, convictionType, needsImmediate } = validated.data;

  let housingData: Record<string, unknown> = {};
  try {
    const dataPath = path.join(process.cwd(), '..', '..', 'data', 'housing', 'national.json');
    const raw = await fs.readFile(dataPath, 'utf-8');
    housingData = JSON.parse(raw);
  } catch {
    housingData = getHardcodedHousing();
  }

  const housingTypes = (housingData.housingTypes as Array<Record<string, unknown>>) || [];
  const stateSpecific = (housingData.stateSpecific as Record<string, { resources: Array<Record<string, unknown>> }>) || {};

  // Filter based on needs
  let results = housingTypes;
  if (needsImmediate) {
    // Prioritize immediate shelter options
    const immediateTypes = ['Rescue Missions / Gospel Missions', 'Salvation Army Adult Rehabilitation Centers', 'Transitional Housing / Halfway Houses'];
    results = [
      ...housingTypes.filter((h) => immediateTypes.includes(h.type as string)),
      ...housingTypes.filter((h) => !immediateTypes.includes(h.type as string)),
    ];
  }

  // Add state-specific resources
  const stateResources = stateSpecific[state || '']?.resources || [];

  await logAudit({
    action: 'search',
    resourceType: 'housing',
    details: { state, needsImmediate, totalOptions: results.length },
    request: req,
  });

  return NextResponse.json({
    state,
    convictionType,
    housingOptions: results,
    stateResources,
    totalOptions: results.length,
    totalStateResources: stateResources.length,
  });
}

function getHardcodedHousing() {
  return {
    housingTypes: [
      { type: 'Transitional Housing', description: 'Structured 6-24 month living after release.', cost: 'Free to $400/month', convictionFriendly: true, howToFind: ['Contact parole officer', 'Call 211', 'Search bop.gov/locations/rrc/'] },
      { type: 'Oxford Houses', description: 'Self-run sober living. 3,000+ houses in 44 states.', cost: '$90-$160/week', convictionFriendly: true, howToFind: ['oxfordhouse.org', 'Call 301-587-2916'] },
      { type: 'Salvation Army ARC', description: 'Free 6-month residential + work therapy.', cost: 'FREE', convictionFriendly: true, howToFind: ['Call 1-800-725-2769', 'Walk into any Salvation Army'] },
      { type: 'Rescue Missions', description: 'Emergency shelter. No questions asked.', cost: 'FREE', convictionFriendly: true, howToFind: ['agrm.org', 'Call 211'] },
      { type: 'Private Landlords', description: 'Small landlords 3x more likely to rent to people with records.', cost: '$500-$1,500/month', convictionFriendly: 'Varies', howToFind: ['Craigslist', 'Facebook Marketplace', 'For Rent signs', 'helpexit.org'] },
      { type: 'Section 8 Voucher', description: 'Federal program pays 70% of rent.', cost: 'You pay 30% of income', convictionFriendly: 'Most felons eligible', howToFind: ['Local housing authority', 'hud.gov'] },
      { type: 'Sober Living', description: 'Drug/alcohol free housing with peer support.', cost: '$400-$800/month', convictionFriendly: true, howToFind: ['soberhousing.net', 'Ask counselor'] },
      { type: 'Rapid Re-Housing', description: 'Short-term rent help to exit homelessness.', cost: 'Subsidized', convictionFriendly: true, howToFind: ['Call 211', 'Local homeless services'] },
    ],
    stateSpecific: {},
  };
}
