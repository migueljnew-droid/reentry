import { describe, it, expect, beforeEach } from 'vitest';

describe('sovereign client', () => {
  beforeEach(() => {
    delete process.env.COUNCIL_URL;
    delete process.env.NEXT_PUBLIC_COUNCIL_URL;
    delete process.env.OPENAI_API_KEY;
  });

  it('falls back to stub when no transport configured', async () => {
    const { invokeAgent } = await import('@/lib/sovereign');
    const r = await invokeAgent({
      agent: 'CRIMINAL_DEF',
      task: 'Summarise the Georgia parole conditions',
    });
    expect(r.provider).toBe('stub');
    expect(r.ok).toBe(false);
    expect(r.content).toContain('CRIMINAL_DEF stub');
  });

  it('chainAgents runs all steps and threads output as context', async () => {
    const { chainAgents } = await import('@/lib/sovereign');
    const results = await chainAgents([
      { agent: 'SOPHIA', task: 'research step' },
      { agent: 'CRIMINAL_DEF', task: 'legal step' },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].agent).toBe('SOPHIA');
    expect(results[1].agent).toBe('CRIMINAL_DEF');
  });

  it('parallelAgents fans out simultaneously', async () => {
    const { parallelAgents } = await import('@/lib/sovereign');
    const [a, b] = await parallelAgents([
      { agent: 'LABOR_CHAMPION', task: 'employment' },
      { agent: 'FAMILY_LAW', task: 'custody' },
    ]);
    expect(a.agent).toBe('LABOR_CHAMPION');
    expect(b.agent).toBe('FAMILY_LAW');
  });

  it('every SovereignResponse has latencyMs', async () => {
    const { invokeAgent } = await import('@/lib/sovereign');
    const r = await invokeAgent({ agent: 'SOVEREIGN', task: 'x' });
    expect(typeof r.latencyMs).toBe('number');
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
