# Antipattern — Test-only Validation in Evolution Engines

**Discovered:** 2026-04-15 (AUDIT-001, quantum cycle `4382bfe2`)

**Mistake**

council-quantum's `validate::run_node_test` ran only `turbo run test` (vitest) to verify mutations. Vitest resolves imports lazily on tested modules only — an unexported symbol imported by untested source files compiles fine at test time but fails at `next build`.

**Consequence**

Quantum cycle `05acd11` emitted `/api/resources/route.ts` importing `ResourceQuerySchema` that was never exported from `schemas.ts`. Test suite passed (284 green). Next `next build` failed with TS2305. Without Chairman catching it, the engine would have shipped 3 more cycles on top of a broken build.

**Fix**

`RULE-001` — Quantum validator now runs `turbo run test build` for Node targets. Build regressions are caught before commit, not after.

**Lesson**

Tests verify code that is tested. Build verifies all code. Evolution engines must run BOTH. Never trust a test-only signal.
