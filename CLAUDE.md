# REENTRY — AI-Powered Reentry Navigator

## Mission
Break the 43% recidivism cycle for 700,000 Americans released from prison every year.

## Entity
FathersCAN, Inc. — 501(c)(3), Georgia. EIN: 41-3929662.

## Tech Stack
- **Backend:** Rust (SOVEREIGN engine integration for AI orchestration)
- **Frontend:** Next.js 14+ (App Router, Server Components, Tailwind CSS)
- **Mobile:** React Native (Expo) — voice-first, offline-capable
- **Database:** PostgreSQL (Supabase) + Vector DB for semantic search
- **AI:** SOVEREIGN orchestration (Chain, Parallel, Ensemble, HumanInTheLoop patterns)
- **Voice:** Whisper API for STT, TTS for voice responses
- **Deploy:** Fly.io (backend), Vercel (web), EAS (mobile)

## Architecture
- Voice-first conversational intake (digital newcomers)
- AI Action Plan Generator (state-specific, time-sequenced)
- 50-state Requirements Database (modular config, not hardcoded)
- Benefits Screening Engine (100+ programs)
- Employment Matching (conviction-type aware)
- Deadline Management System
- Case Manager / Parole Officer Dashboard (B2G)
- Risk Assessment (multi-dimensional, cascade prevention)
- Offline-capable action plans

## Key Constraints
- Users may have ZERO digital literacy — voice-first is mandatory
- PII handling for justice-involved populations — CJIS security
- Must work offline (unreliable internet access)
- State-by-state complexity (50 different rule sets)
- Cost-aware AI routing (< $0.15/interaction)

## Development Methodology
- SPEAR Framework (Spec → Plan → Execute → Audit → Ratchet)
- SOVEREIGN agents for domain reasoning
- All code tested before claiming done
- Wiring verification protocol (no dead code)

## Revenue Model
- Government contracts (DOJ/DOL grants)
- Foundation funding (Google.org, MacArthur, Ford)
- B2G SaaS (parole/probation dashboards)
- Open-source core + premium features

## Input Validation

All API route handlers MUST validate incoming data with the Zod schemas in
`packages/web/src/lib/validation/schemas.ts` before any business logic runs.

```ts
import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  const data = parseOrThrow(IntakeSchema, await req.json());
  // data is fully typed — proceed safely
}
```

`parseOrThrow` throws with `statusCode: 422` and a structured `issues` array
on failure. Catch it in a shared error handler and return the issues to the
client so the UI can surface field-level errors.

### Why this matters
Wrong release dates break eligibility calculations. Wrong state codes silently
return empty resource lists. For a justice-involved population, silent failures
cause real harm — validate at the boundary, always.

## API Route Pattern (Validation + Error Handling)

Every App Router route handler MUST use both `parseOrThrow` (validation) and
`withErrorHandler` (structured error responses). Using one without the other
leaves either unvalidated inputs or unhandled thrown errors.

```ts
import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';

export const POST = withErrorHandler(async (req: Request) => {
  const data = parseOrThrow(IntakeSchema, await req.json());
  // data is fully typed — proceed safely
  return Response.json({ ok: true, data });
});
```

`withErrorHandler` catches `ValidationError` and returns:
```json
{
  "error": "Validation failed",
  "statusCode": 422,
  "issues": [
    { "path": ["releaseState"], "message": "Must be a valid 2-letter US state code or FED", "code": "invalid_string" }
  ]
}
```

The UI reads `issues` and surfaces field-level errors inline — no generic
"something went wrong" messages for a population that may have low digital
literacy.

### Schema Location
`packages/web/src/lib/validation/schemas.ts` — add new schemas here as new
routes are created. Export both the Zod schema and its inferred TypeScript type.

Available schemas:
- `IntakeSchema` / `IntakeData` — voice/form intake (release date, state, needs)
- `BenefitsScreeningSchema` / `BenefitsScreeningData` — 100+ program eligibility
- `EmploymentSearchSchema` / `EmploymentSearchData` — conviction-aware job matching
- `DeadlineSchema` / `DeadlineData` — parole check-ins, court dates, reminders

`ValidationError` is exported from the same file — `withErrorHandler` catches it
automatically. Do not catch it manually in route handlers.

### Error Handler Location
`packages/web/src/lib/api/error-handler.ts` — exports `withErrorHandler`.

### Test Location
`packages/web/src/__tests__/validation/schemas.test.ts`
`packages/web/src/__tests__/api/error-handler.test.ts``
`packages/web/src/__tests__/api/error-handler.test.ts`

### Import Paths (canonical)
```ts
import { parseOrThrow, IntakeSchema, ValidationError } from '@/lib/validation/schemas';
import { withErrorHandler } from '@/lib/api/error-handler';
```

### Available Schemas
| Schema | Type | Use case |
|--------|------|----------|
| `IntakeSchema` | `Intake` | POST /api/intake — conversational intake form |
| `ResourceQuerySchema` | `ResourceQuery` | GET /api/resources — resource search |
| `ActionPlanRequestSchema` | `ActionPlanRequest` | POST /api/action-plan — plan generation |
| `StateCodeSchema` | `StateCode` | Reusable state code validator |`

### Dependency
`zod` must be listed in `packages/web/package.json` dependencies:
```bash
npm install zod --workspace=packages/web
```

### Files
| File | Purpose |
|------|---------|
| `packages/web/src/lib/validation/schemas.ts` | All Zod schemas + `parseOrThrow` + `ValidationError` |
| `packages/web/src/lib/api/error-handler.ts` | `withErrorHandler` App Router wrapper |
| `packages/web/src/__tests__/validation/schemas.test.ts` | Vitest suite — run with `npm test` |` — every new schema
MUST have at least: one passing test, one test for an invalid state code (if
applicable), and one test verifying `parseOrThrow` throws `ValidationError`.

## Health Check Endpoint

A liveness + readiness probe is available at `GET /healthz`.

```
GET /healthz
→ 200 { status: "ok", uptime: 42.1, responseTimeMs: 1, checks: { server: "ok" }, timestamp: "..." }
→ 503 { status: "degraded", ... }  ← when any check fails
```

Hosting platforms (Vercel, Fly.io) should point their health-check config at `/healthz`.
Add new dependency checks (DB ping, Redis ping) inside `packages/web/src/app/healthz/route.ts`.

## Validation + Error Handling Infrastructure

The following files implement the patterns mandated above:

| File | Purpose |
|------|---------|
| `packages/web/src/lib/validation/schemas.ts` | All Zod schemas + `parseOrThrow` + `ValidationError` |
| `packages/web/src/lib/api/error-handler.ts` | `withErrorHandler` wrapper for App Router handlers |
| `packages/web/src/__tests__/validation/schemas.test.ts` | Unit tests for all schemas |
| `packages/web/src/__tests__/api/error-handler.test.ts` | Unit tests for error handler |

To add a new route:
1. Define a Zod schema in `schemas.ts` and export its inferred type.
2. Wrap the handler with `withErrorHandler`.
3. Call `parseOrThrow(YourSchema, await req.json())` before any business logic.
4. Add tests in `packages/web/src/__tests__/`.

## Accessibility Testing (WCAG 2.1 AA)

All UI components MUST pass WCAG 2.1 AA before merge. This is both a legal
requirement (ADA) and a mission requirement — reentry clients include people
with disabilities, limited literacy, and aging populations.

### Setup (one-time, inside `packages/web`)

```bash
npm install --save-dev vitest-axe axe-core
```

### Running Accessibility Tests

```bash
# From repo root
turbo run test

# Or directly
cd packages/web && npx vitest run src/__tests__/accessibility/
```

### Adding New Component Tests

For every new page or form component, add an axe audit in
`packages/web/src/__tests__/accessibility/`. Pattern:

```ts
import { configureAxe } from 'vitest-axe';
import { render } from '@testing-library/react';

const axe = configureAxe({ /* WCAG 2.1 AA rules */ });

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results.violations).toHaveLength(0);
});
```

### Critical Rules for This Population

- All form inputs MUST have explicit `<label>` elements (not placeholder-only)
- All buttons MUST have visible text or `aria-label`
- Color contrast ratio MUST be ≥ 4.5:1 for normal text
- All interactive elements MUST be keyboard-navigable
- Error messages MUST be associated with fields via `aria-describedby`
- Voice interface MUST have text fallback for every interaction

### Why This Matters

Silent accessibility failures cause real harm. A screen reader user who cannot
complete the intake form loses access to housing, benefits, and employment
resources. Catch violations at $0 cost in CI — not post-deployment.

## Example: Wired Intake Route

Below is a complete, copy-paste-ready App Router route that satisfies both
mandatory patterns (`parseOrThrow` + `withErrorHandler`):

```ts
// packages/web/src/app/api/intake/route.ts
import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';

export const POST = withErrorHandler(async (req: Request) => {
  const data = parseOrThrow(IntakeSchema, await req.json());
  // data is fully typed: IntakeInput
  // TODO: pass data to SOVEREIGN action-plan generator
  return Response.json({ ok: true, data }, { status: 201 });
});
```

### Checklist for every new API route
- [ ] Handler is wrapped with `withErrorHandler`
- [ ] First line of handler calls `parseOrThrow(YourSchema, await req.json())`
- [ ] Schema is defined and exported from `packages/web/src/lib/validation/schemas.ts`
- [ ] Tests exist in `packages/web/src/__tests__/validation/schemas.test.ts`
- [ ] No raw `req.json()` result is used without parsing

## Voice-First Intake Pipeline

### Why Voice-First Is Mandatory

Many returning citizens have been incarcerated for 5–25 years. They may have
never owned a smartphone. Reading comprehension may be at a 4th–6th grade
level. Typing is slow and error-prone on a phone keyboard. For this population,
**voice is not a nice-to-have — it is the only viable primary interface.**

The intake pipeline is designed so that a person can complete the entire
onboarding process by speaking, with zero typing required.

### Architecture: Pure Finite-State Machine

The intake FSM lives in `packages/web/src/lib/voice/transcript.ts`.
It is **100% pure** — no I/O, no side effects, no async. This makes it:
- Fully unit-testable without mocks
- Safe to run offline (React Native)
- Easy to replay / audit for CJIS compliance

#### States (in order)

```
greeting → name → release_date → state → release_type
         → obligations → benefits_needed → employment_goals
         → summary → done
```

Each state has:
- A **prompt** (plain English, ≤ 5th-grade level)
- A **parser** that extracts structured data from free-form speech
- A **retry prompt** if the parser returns null (max retries tracked)

#### Key Functions

| Function | Purpose |
|---|---|
| `createSession(id)` | Create a fresh `IntakeSession` |
| `advanceSession(session, userText)` | Pure FSM transition → `AdvanceResult` |
| `parseName(text)` | Extract name, strip prefixes, title-case |
| `parseReleaseDate(text)` | Parse spoken dates → YYYY-MM-DD |
| `parseStateCode(text)` | Map state name or abbreviation → 2-letter code |
| `parseReleaseType(text)` | Classify parole / probation / time_served / other |
| `parseList(text)` | Split comma/and-separated spoken lists |

#### Data Shape

```ts
interface CollectedData {
  name?: string;
  releaseDate?: string;    // YYYY-MM-DD
  releaseState?: string;   // 2-letter code or FED
  releaseType?: string;    // parole | probation | time_served | other
  obligations?: string[];
  benefitsNeeded?: string[];
  employmentGoals?: string;
}
```

### API Route

`POST /api/intake/voice`

```json
// Request
{ "sessionId": "uuid", "userText": "My name is John Smith", "audioRef": "s3://..." }

// Response
{ "assistantReply": "Thanks, John! When did you get out?",
  "done": false, "collected": { "name": "John Smith" },
  "currentState": "release_date", "sessionId": "uuid" }
```

`GET /api/intake/voice?sessionId=xxx` — resume a session after page reload.

Session store is currently in-memory (Map + 30-min TTL). Swap
`getOrCreateSession` / `saveSession` in `route.ts` for Supabase calls
when the DB layer is ready — no FSM changes required.

### Prompt Design Rules

All prompts in `packages/web/src/lib/voice/prompts.ts` follow:
1. One question per turn — never compound questions
2. Confirm what was heard before asking the next question
3. Offer a concrete example for any format (dates, state names)
4. Use "you" not "the user" — direct, warm, human
5. Never use legal jargon (parole officer → "your check-in person")

### Extending the FSM

To add a new intake state:
1. Add the state name to `IntakeState` union in `transcript.ts`
2. Insert it into `STATE_ORDER` at the correct position
3. Add a `case` block in `advanceSession` with a parser
4. Add prompt + retry prompt in `prompts.ts`
5. Add ≥ 3 tests in `transcript.test.ts`

### Files

| File | Purpose |
|---|---|
| `packages/web/src/lib/voice/transcript.ts` | FSM types, parsers, `advanceSession` |
| `packages/web/src/lib/voice/prompts.ts` | Plain-English prompt templates |
| `packages/web/src/app/api/intake/voice/route.ts` | HTTP route (POST + GET) |
| `packages/web/src/__tests__/voice/transcript.test.ts` | 18 vitest tests |
