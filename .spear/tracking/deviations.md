# Deviations Log

## Deviation [D-001]
- **Task:** plans/generate validation
- **Category:** bug-fix
- **Planned:** Pass validated.data directly to generateReentryPlan
- **Actual:** Cast validated.data to any before passing to generateReentryPlan, because the IntakeData interface in generate-plan.ts requires fullName and checkInFrequency fields not present in planGenerateSchema. This is a pre-existing type mismatch (original code used untyped req.json() which bypassed checking).
- **Reason:** The planGenerateSchema was designed for the API route body, which doesn't include all IntakeData fields. The generate-plan action fills in defaults. Fixing the schema or interface is out of scope for validation-only task.
- **Impact:** No runtime impact. Same data flows through as before, now with validation on the fields that ARE sent.

## Deviation [D-002]
- **Task:** validate.ts Zod v4 compatibility
- **Category:** bug-fix
- **Planned:** Do not modify validate.ts
- **Actual:** Must fix validate.ts because it uses Zod v3 API (.errors) but project has Zod v4 (.issues). Without this fix, validateRequest() will throw TypeError at runtime on any invalid input, making all validation non-functional.
- **Reason:** validate.ts was written for Zod v3 but package.json has zod ^4.3.6. The .errors property does not exist on ZodError in v4 -- it's .issues.
- **Impact:** Critical fix. Without it, every route using validateRequest will crash on invalid input instead of returning 422.

## Deviation [D-003]
- **Task:** schemas.ts Zod v4 compatibility
- **Category:** bug-fix
- **Planned:** Do not modify schemas.ts
- **Actual:** Fixed z.record(z.unknown()) to z.record(z.string(), z.unknown()) for Zod v4 compatibility. In Zod v4, z.record() requires both key and value schemas.
- **Reason:** schemas.ts had TypeScript compilation errors (TS2554) that would block the build. Two calls to z.record() used Zod v3 single-arg API.
- **Impact:** Minimal -- same runtime behavior, fixes compilation error.

## Deviation [D-004]
- **Task:** SHARD-009, Task 1: Enable `"strict": true` in tsconfigs
- **Category:** scope-addition (already done)
- **Planned:** Enable `"strict": true` in `packages/web/tsconfig.json` and `packages/shared/tsconfig.json`
- **Actual:** Both tsconfigs already have `"strict": true` enabled. `tsc --noEmit` passes with zero errors.
- **Reason:** Strict mode was enabled in a prior phase or from project init.
- **Impact:** No code changes needed for this sub-task. Proceeding directly to ESLint setup.
