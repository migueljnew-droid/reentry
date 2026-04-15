/**
 * Intake page smoke tests — FSM-level testing is in voice/transcript.test.ts.
 * This file just verifies the page module loads and exports what we expect.
 */
import { describe, it, expect } from 'vitest';

describe('intake page module', () => {
  it('exports a default React component', async () => {
    const mod = await import('../../app/intake/page');
    expect(typeof mod.default).toBe('function');
  });

  it('IntakeClient module loads', async () => {
    const mod = await import('../../app/intake/IntakeClient');
    expect(typeof mod.default).toBe('function');
  });

  it('voice/transcript module exports createSession and advanceSession', async () => {
    const mod = await import('../../lib/voice/transcript');
    expect(typeof mod.createSession).toBe('function');
    expect(typeof mod.advanceSession).toBe('function');
  });
});
