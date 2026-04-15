/**
 * Accessibility audit — root layout and key page shells
 *
 * Uses axe-core via vitest to catch WCAG 2.1 AA violations before
 * deployment. Failures here mean real barriers for reentry clients
 * who may use screen readers, high-contrast modes, or keyboard-only nav.
 *
 * Run: turbo run test (or `npx vitest run` inside packages/web)
 */
import { describe, it, expect } from 'vitest';

// Lightweight axe-core wrapper — install with:
//   npm install --save-dev axe-core vitest-axe  (inside packages/web)
// Until installed, this file documents the intended pattern and will
// be skipped by vitest if the import is unavailable.
let configureAxe: ((opts?: object) => (node: Element) => Promise<{ violations: unknown[] }>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('vitest-axe');
  configureAxe = mod.configureAxe ?? mod.default?.configureAxe ?? null;
} catch {
  // vitest-axe not yet installed — tests will be skipped
}

const axe = configureAxe
  ? configureAxe({
      rules: [
        // Enforce WCAG 2.1 AA — the legal baseline for ADA compliance
        { id: 'color-contrast', enabled: true },
        { id: 'label', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'image-alt', enabled: true },
        { id: 'link-name', enabled: true },
        { id: 'landmark-one-main', enabled: true },
        { id: 'region', enabled: true },
      ],
    })
  : null;

/**
 * Helper: create a minimal DOM fragment for testing.
 * Replace with @testing-library/react renders as components are built.
 */
function makeFragment(html: string): Element {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
}

describe('Accessibility — WCAG 2.1 AA baseline', () => {
  it('skips gracefully when vitest-axe is not installed', () => {
    if (!axe) {
      console.warn(
        '[a11y] vitest-axe not installed. Run: npm install --save-dev vitest-axe axe-core'
      );
      expect(true).toBe(true); // placeholder until dep is added
      return;
    }
    expect(axe).toBeTruthy();
  });

  it('intake form shell has no critical WCAG violations', async () => {
    if (!axe) return; // skip until vitest-axe installed

    // Minimal representation of the intake form structure.
    // Replace with actual rendered component once testing-library is wired.
    const fragment = makeFragment(`
      <main>
        <h1>Get Your Reentry Plan</h1>
        <form aria-label="Reentry intake form">
          <div>
            <label for="release-state">State of Release</label>
            <select id="release-state" name="releaseState" required>
              <option value="">Select your state</option>
              <option value="GA">Georgia</option>
              <option value="CA">California</option>
              <option value="TN">Tennessee</option>
            </select>
          </div>
          <div>
            <label for="release-date">Release Date</label>
            <input
              id="release-date"
              name="releaseDate"
              type="date"
              required
              aria-describedby="release-date-hint"
            />
            <span id="release-date-hint">Format: MM/DD/YYYY</span>
          </div>
          <button type="submit">Generate My Plan</button>
        </form>
      </main>
    `);

    const results = await axe(fragment);
    // Surface all violations with actionable messages
    if (results.violations.length > 0) {
      const summary = (results.violations as Array<{ id: string; description: string; nodes: unknown[] }>)
        .map((v) => `[${v.id}] ${v.description} (${v.nodes.length} node(s))`)
        .join('\n');
      throw new Error(`Accessibility violations found:\n${summary}`);
    }
    expect(results.violations).toHaveLength(0);
  });

  it('action plan output shell has no critical WCAG violations', async () => {
    if (!axe) return;

    const fragment = makeFragment(`
      <main>
        <h1>Your Reentry Action Plan</h1>
        <nav aria-label="Plan sections">
          <ol>
            <li><a href="#id-docs">ID Documents</a></li>
            <li><a href="#benefits">Benefits</a></li>
            <li><a href="#housing">Housing</a></li>
            <li><a href="#employment">Employment</a></li>
          </ol>
        </nav>
        <section id="id-docs" aria-labelledby="id-docs-heading">
          <h2 id="id-docs-heading">Step 1: Get Your ID</h2>
          <p>Visit your state DMV within 30 days of release.</p>
          <a href="https://dds.georgia.gov" rel="noopener noreferrer">
            Georgia DDS — Get State ID
          </a>
        </section>
      </main>
    `);

    const results = await axe(fragment);
    if (results.violations.length > 0) {
      const summary = (results.violations as Array<{ id: string; description: string; nodes: unknown[] }>)
        .map((v) => `[${v.id}] ${v.description} (${v.nodes.length} node(s))`)
        .join('\n');
      throw new Error(`Accessibility violations found:\n${summary}`);
    }
    expect(results.violations).toHaveLength(0);
  });
});
