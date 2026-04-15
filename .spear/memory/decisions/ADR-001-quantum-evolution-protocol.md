# ADR-001 — Adopt Quantum Evolution Protocol as Primary Continuous Improvement Mechanism

**Date:** 2026-04-15
**Status:** Accepted
**Context**

REENTRY's SPEC-001 (Security Lockdown) + SPEC-002 shipped 247 tests across 19 files, with manual iteration cycles. For continuous quality raising (more tests, docs, hardening, infra) we needed an automated evolution path that:
- proposes mutations using LLM reasoning
- validates them inside the target project (not the engine repo)
- auto-rolls-back on regression
- emits atomic git commits with receipts

**Decision**

Use `council-quantum` (the SPEAR Quantum Evolution Protocol binary) as the primary engine for bulk, non-spec-driven improvements to REENTRY. Triggered via `/spear:quantum` with `External::WebApp` target.

**Consequences**

- ✅ 11 accepted cycles shipped 37 new tests, 3 new API routes, 1 new validation library, 1 new error-handler lib, 2 CI workflows, a Dockerfile, pa11y a11y pipeline, and 366 lines of doctrine. Auto-commits with receipt audit trail.
- ✅ Engine self-protects via rollback: 3 mutation attempts that broke tests were reverted cleanly.
- ⚠️ Engine validator is test-only by default. One build regression (AUDIT-001) slipped through and had to be fixed manually. RULE-001 mandates `next build` in validator from next cycle onward.
- ⚠️ Planner does not yet know dependency versions — emitted Zod v3 API against Zod v4. RULE-002 mandates version-aware context.
- 🔒 Monotonic ratchet now locks: 280 test floor, 15s build ceiling, 110kb first-load JS ceiling.

**Follow-up**

Next cycle should land engine patches for RULE-001 + RULE-002 before another `/spear:quantum` run.
