/**
 * SOVEREIGN client — invokes the Council multi-agent reasoning engine.
 *
 * Two transports, auto-selected:
 *   1. Remote: HTTPS to grandcouncil.cloud (the Rust Council gateway).
 *   2. Local:  OpenAI with a system prompt that casts Claude/GPT as the
 *              requested agent persona. Used as fallback when COUNCIL_URL
 *              is not configured.
 *
 * Why we need this: REENTRY's rule engine + FSM is table-stakes. The
 * domain reasoning — "which Georgia SNAP program covers someone with a
 * drug felony", "how does this parole violation cascade", "what is the
 * conviction-aware cover letter for this employer" — requires a panel of
 * specialists, not one model. SOVEREIGN routes per-task to the right
 * agent (LEXIS for legal, SOPHIA for research, etc.) and synthesises.
 */

import OpenAI from 'openai';

export type CouncilAgent =
  | 'SOVEREIGN'
  | 'SOPHIA'
  | 'LEXIS'
  | 'CRIMINAL_DEF'
  | 'LABOR_CHAMPION'
  | 'FAMILY_LAW'
  | 'CIVIL_RIGHTS_LITIGATOR'
  | 'CONTENT_FORGE'
  | 'TECHNE'
  | 'AEGIS'
  | 'LOGOS';

export interface SovereignInvoke {
  agent: CouncilAgent;
  task: string;
  context?: Record<string, unknown>;
  /** Optional response-shape hint (e.g. 'json', 'markdown', 'plaintext') */
  format?: 'json' | 'markdown' | 'plaintext';
  maxTokens?: number;
}

export interface SovereignResponse {
  ok: boolean;
  agent: CouncilAgent;
  content: string;
  provider: 'council-remote' | 'council-local-openai' | 'stub';
  model: string;
  tokens?: number;
  latencyMs: number;
}

const AGENT_PERSONAS: Record<CouncilAgent, string> = {
  SOVEREIGN:
    'You are SOVEREIGN — executive synthesis. Cut through noise, return a clear verdict in plain language.',
  SOPHIA:
    'You are SOPHIA — research and analysis. Cite sources when possible, flag unverified claims with VERIFY:.',
  LEXIS:
    'You are LEXIS — head of a 34-agent legal division synthesising 270 of the greatest legal minds. Answer with precise statutory references when relevant.',
  CRIMINAL_DEF:
    'You are CRIMINAL_DEF — a criminal defense specialist combining the tactical sense of Darrow, Cochran, Dershowitz, and Bryan Stevenson. Protect the client. Prefer harm-reduction framing for justice-involved clients.',
  LABOR_CHAMPION:
    'You are LABOR_CHAMPION — employment law (Brandeis, Perkins, Greenberg, Mehri). Know ban-the-box statutes by state. Write for a returning citizen, not a lawyer.',
  FAMILY_LAW:
    'You are FAMILY_LAW — family law specialist. Prioritise continuity-of-care for children and custody protection for returning parents.',
  CIVIL_RIGHTS_LITIGATOR:
    'You are CIVIL_RIGHTS_LITIGATOR — civil rights (Crump, Dees, Stevenson, Mehri). Spot discrimination patterns. Document facts.',
  CONTENT_FORGE:
    'You are CONTENT_FORGE — write in plain, 5th-grade English when the reader is a returning citizen. Short sentences. No legal jargon unless defined inline.',
  TECHNE:
    'You are TECHNE — technical architecture. Propose concrete code/config changes, not abstract advice.',
  AEGIS:
    'You are AEGIS — security + threat modelling. Think adversarially. Name specific attack vectors.',
  LOGOS:
    'You are LOGOS — data + analytics. Lead with numbers. Show your work.',
};

function councilUrl(): string | null {
  return process.env.COUNCIL_URL || process.env.NEXT_PUBLIC_COUNCIL_URL || null;
}

/**
 * Invoke a Council agent. Transparently falls back:
 *   remote HTTP → local OpenAI persona → stub.
 * Never throws — returns a SovereignResponse with `ok: false` on total failure.
 */
export async function invokeAgent(req: SovereignInvoke): Promise<SovereignResponse> {
  const started = Date.now();

  // Transport 1: remote Council gateway (preferred).
  const url = councilUrl();
  if (url) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/v3/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.COUNCIL_AUTH_TOKEN
            ? { Authorization: `Bearer ${process.env.COUNCIL_AUTH_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          agent: req.agent,
          prompt: req.task,
          context: req.context ?? {},
          max_tokens: req.maxTokens ?? 1500,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const body = (await res.json()) as { content?: string; model?: string; tokens?: number };
        return {
          ok: true,
          agent: req.agent,
          content: body.content ?? '',
          provider: 'council-remote',
          model: body.model ?? 'council',
          tokens: body.tokens,
          latencyMs: Date.now() - started,
        };
      }
    } catch {
      // Fall through to local transport.
    }
  }

  // Transport 2: local OpenAI with agent persona.
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const persona = AGENT_PERSONAS[req.agent] ?? AGENT_PERSONAS.SOVEREIGN;
      const formatHint =
        req.format === 'json'
          ? '\n\nReturn STRICT JSON only — no prose, no code fences.'
          : req.format === 'markdown'
          ? '\n\nReturn GitHub-flavoured Markdown only.'
          : '';
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: req.maxTokens ?? 1500,
        messages: [
          { role: 'system', content: persona + formatHint },
          {
            role: 'user',
            content:
              req.task +
              (req.context ? `\n\nContext:\n${JSON.stringify(req.context, null, 2)}` : ''),
          },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? '';
      return {
        ok: true,
        agent: req.agent,
        content,
        provider: 'council-local-openai',
        model: completion.model,
        tokens: completion.usage?.total_tokens,
        latencyMs: Date.now() - started,
      };
    } catch {
      // Fall through to stub.
    }
  }

  // Transport 3: stub — deterministic, offline, for tests + no-key dev.
  return {
    ok: false,
    agent: req.agent,
    content: `[${req.agent} stub] ${req.task.slice(0, 120)}… (no COUNCIL_URL or OPENAI_API_KEY configured)`,
    provider: 'stub',
    model: 'stub',
    latencyMs: Date.now() - started,
  };
}

/**
 * Chain: run agents sequentially, piping each output as context to the next.
 * Common pattern: SOPHIA (research) → LEXIS (legal lens) → CONTENT_FORGE (plain-language output).
 */
export async function chainAgents(
  steps: Array<{ agent: CouncilAgent; task: string; format?: SovereignInvoke['format'] }>,
  initialContext: Record<string, unknown> = {},
): Promise<SovereignResponse[]> {
  const results: SovereignResponse[] = [];
  let context = { ...initialContext };
  for (const step of steps) {
    const r = await invokeAgent({
      agent: step.agent,
      task: step.task,
      format: step.format,
      context,
    });
    results.push(r);
    context = { ...context, [`${step.agent}_output`]: r.content };
  }
  return results;
}

/**
 * Parallel: fan out to N agents simultaneously, return all results.
 */
export async function parallelAgents(
  invocations: SovereignInvoke[],
): Promise<SovereignResponse[]> {
  return Promise.all(invocations.map(invokeAgent));
}
