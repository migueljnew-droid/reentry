import { NextRequest, NextResponse } from 'next/server';
import { chainAgents } from '@/lib/sovereign';

/**
 * POST /api/plans/ai-narrative
 *
 * Takes a basic intake payload and returns a SOVEREIGN-orchestrated,
 * plain-language action narrative for a returning citizen.
 *
 * Chain:
 *   SOPHIA          — research relevant state programs for this profile
 *   CRIMINAL_DEF    — conviction-aware eligibility + pitfall narrative
 *   LABOR_CHAMPION  — ban-the-box + employment angle for this state
 *   CONTENT_FORGE   — rewrite the full synthesis in 5th-grade English
 *
 * This is the layer that turns REENTRY from a rule engine into an
 * advocate in your pocket.
 */
export async function POST(req: NextRequest) {
  let body: {
    state?: string;
    convictionType?: string;
    immediateNeeds?: string[];
    hasChildren?: boolean;
    hasSupportNetwork?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const state = (body.state ?? 'GA').toUpperCase();
  const convictionType = body.convictionType ?? 'nonviolent';
  const needs = Array.isArray(body.immediateNeeds) ? body.immediateNeeds : [];

  const profile = {
    state,
    convictionType,
    immediateNeeds: needs,
    hasChildren: Boolean(body.hasChildren),
    hasSupportNetwork: Boolean(body.hasSupportNetwork),
  };

  const chain = await chainAgents(
    [
      {
        agent: 'SOPHIA',
        task: `Research the top 5 reentry programs in ${state} for someone with a ${convictionType} conviction. Immediate needs: ${needs.join(', ') || 'unspecified'}. Surface actual program names + application URLs where known. Mark any unverified claim with VERIFY:.`,
      },
      {
        agent: 'CRIMINAL_DEF',
        task: `Given the research above, flag the top 3 eligibility pitfalls for this ${state} ${convictionType} profile that could cause this person to be rejected or re-incarcerated. Concrete actions to avoid each.`,
      },
      {
        agent: 'LABOR_CHAMPION',
        task: `Given the profile + research, what are the ${state} ban-the-box protections and which industries should this person prioritize applying to in the first 90 days? Plain language.`,
      },
      {
        agent: 'CONTENT_FORGE',
        task: 'Synthesize all the above into a single, 5th-grade-English action narrative (400-600 words) that a recently-released person can read without legal help. Lead with 3 concrete actions for this week. End with a motivating sentence.',
        format: 'markdown',
      },
    ],
    profile,
  );

  const final = chain[chain.length - 1];
  return NextResponse.json({
    ok: final.ok,
    profile,
    narrative: final.content,
    provider: final.provider,
    model: final.model,
    chainLatencyMs: chain.reduce((a, b) => a + b.latencyMs, 0),
    chainSteps: chain.map((c) => ({
      agent: c.agent,
      provider: c.provider,
      ok: c.ok,
      latencyMs: c.latencyMs,
    })),
  });
}
