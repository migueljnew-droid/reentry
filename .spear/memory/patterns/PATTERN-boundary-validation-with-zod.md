# Pattern — Boundary Validation with Zod + parseOrThrow

**Established:** 2026-04-15 (Quantum cycle `8886228e`)

**Problem**

For a justice-involved user base, silent data-validation failures cause real harm — wrong state code returns empty resource lists, wrong release date miscalculates eligibility. Defense-in-depth requires strict validation at every system boundary, not relaxed or inferred validation.

**Pattern**

Every API route handler MUST call `parseOrThrow(Schema, await req.json())` before any business logic. All schemas live in `packages/web/src/lib/validation/schemas.ts`. `parseOrThrow` throws `ValidationError` with `statusCode: 422` and a structured `issues` array; a shared error handler (`withErrorHandler` in `lib/api/error-handler.ts`) catches and formats the response.

**Example**

```ts
export const POST = withErrorHandler(async (req: Request) => {
  const data = parseOrThrow(IntakeSchema, await req.json());
  // data is fully typed — proceed safely
});
```

**Why it matters**

For a recently released person searching for housing/food/work, "no results" is ambiguous — did nothing match, or was the query malformed? Strict 422 with field-level issues gives the UI something actionable to show, and gives ops real logs to debug.
