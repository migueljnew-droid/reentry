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

### Test Location
`packages/web/src/__tests__/validation/schemas.test.ts` — every new schema
MUST have at least: one passing test, one test for an invalid state code (if
applicable), and one test verifying `parseOrThrow` throws `ValidationError`.
