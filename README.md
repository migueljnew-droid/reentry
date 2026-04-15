<div align="center">

# 🔓 REENTRY

### AI-Powered Reentry Navigator

**Breaking the 43% recidivism cycle for 700,000 Americans released from prison every year.**

[![Live](https://img.shields.io/badge/🌐_LIVE-reentry.vercel.app-2577eb?style=for-the-badge)](https://reentry.vercel.app)
[![License](https://img.shields.io/badge/License-AGPL_3.0-green?style=for-the-badge)](LICENSE)
[![Built With](https://img.shields.io/badge/Built_With-Rust_+_Next.js-orange?style=for-the-badge)](#tech-stack)

<br />

*You did your time. Now get your life back.*

</div>

---

## The Problem

Every year, **700,000 people** leave American prisons. Within three years, **43% will be back** — not because they choose to reoffend, but because the system they re-enter is designed to fail them.

A returning citizen receives a bus ticket, $50 in gate money, and zero guidance. They must navigate **8-15 separate agencies** — DMV, Social Services, Housing Authority, Workforce Development, Parole, Courts, Healthcare — with no unified tool that says: *here is what you need to do, in what order, by when.*

**Every technology startup that attempted to solve this is dead.** Uptrust ($5.9M raised) was acquired. 70MillionJobs is inactive. No comprehensive, AI-powered reentry navigator exists anywhere.

Until now.

---

## What REENTRY Does

<table>
<tr>
<td width="50%">

### 🎤 Voice-First Intake
Many returning citizens have been incarcerated for years or decades. They may have never used a smartphone. REENTRY's primary interface is **conversational** — speak your situation, receive your plan.

### 📋 Personalized Action Plan
In under 60 seconds, get a step-by-step roadmap covering **ID replacement, benefits enrollment, housing, employment, and legal obligations** — specific to YOUR state.

### 💰 Benefits Screening
We screen against **100+ federal and state programs** — SNAP, Medicaid, housing, phone service, job training — and help you apply.

</td>
<td width="50%">

### 💼 Employment Matching
Matched to employers who **hire people with records**. Filtered by your skills, conviction type, and location.

### ⏰ Deadline Management
Parole check-ins, court dates, benefits recertification — we remind you **before every single one**.

### 📴 Works Offline
Your action plan is saved to your phone. **No internet? You've still got your roadmap.**

</td>
</tr>
</table>

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend API** | Rust (Actix-web) | Memory safety for PII, sub-second response |
| **Frontend** | Next.js 14 (App Router) | SSR, server components, SEO |
| **Mobile** | React Native (Expo) | Cross-platform, offline-capable |
| **Database** | PostgreSQL (Supabase) | Row-level security, real-time |
| **AI** | Claude / GPT-4o (cost-aware routing) | Plan generation, benefits screening |
| **Voice** | Whisper API | Best-in-class transcription |
| **Deploy** | Vercel + Fly.io | Edge deployment, low latency |

---

## State Coverage

| State | Status | Data |
|-------|--------|------|
| 🍑 **Georgia** | ✅ Complete | DDS, DFCS, SNAP, Medicaid, TANF, LIHEAP, shelters, legal aid |
| 🌴 **California** | ✅ Complete | DMV, CalFresh, Medi-Cal, CalWORKs, Homeboy Industries, CEO |
| 🎸 **Tennessee** | ✅ Complete | SNAP, TennCare, Families First, Dismas House |
| 🇺🇸 **Federal** | ✅ Complete | SSA, SNAP, Medicaid, SSI, Lifeline, Pell Grant |
| 📍 **47 more states** | 🔜 Coming | Modular architecture — add states via config |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                       │
│   Next.js Web    React Native Mobile    Dashboard   │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────┐
│              RUST API (Actix-web)                     │
│   Routes │ AI Engine │ Auth │ Rate Limiting           │
└────────────────────────┬────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───┴────┐        ┌──────┴──────┐      ┌─────┴─────┐
│ AI LLM │        │  Supabase   │      │ External  │
│ Router  │        │ (Postgres)  │      │ Services  │
│         │        │  + RLS      │      │ Voice/Job │
└─────────┘        └─────────────┘      └───────────┘
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/migueljnew-droid/reentry.git
cd reentry

# Install
npm install --legacy-peer-deps

# Set up environment
cp .env.example packages/web/.env.local
# Edit with your Supabase credentials

# Run web app
cd packages/web && npm run dev

# Run API (requires Rust)
cd packages/api && cargo run
```

---

## Impact Metrics

| Metric | Current | 12-Month Target |
|--------|---------|-----------------|
| Users served | 0 | 10,000 |
| Recidivism rate | 43% national | < 30% cohort |
| ID within 30 days | ~30% | 75% |
| Employed within 90 days | 40% | 60% |
| Housed within 90 days | ~50% | 70% |

If REENTRY reduces recidivism from 43% to 25% across 50,000 users, that's **9,000 people who stay free** — saving taxpayers **$411 million annually**.

---

## About

**REENTRY** is a project of [FathersCAN, Inc.](https://www.fathers-can.com), a 501(c)(3) nonprofit corporation registered in Georgia.

Built by **Miguel Louis Jiminez** — a father who fought through the justice system himself, as a self-represented litigant in federal court (*Jiminez v. Elliott*, 42 U.S.C. §1983). This isn't a startup experiment. It's a tool built from lived experience.

---

<div align="center">

**The system failed them. This tool won't.**

[![Get Started](https://img.shields.io/badge/Get_Started-reentry.vercel.app-2577eb?style=for-the-badge&logo=vercel)](https://reentry.vercel.app)

</div>

---

## Input Validation

All API route handlers **must** validate incoming data with the Zod schemas in
`packages/web/src/lib/validation/schemas.ts` before any business logic runs.

```ts
import { parseOrThrow, IntakeSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  const data = parseOrThrow(IntakeSchema, await req.json());
  // data is fully typed — proceed safely
}
```

`parseOrThrow` throws a `ValidationError` with `statusCode: 422` and a
structured `issues` array on failure. Catch it in a shared error handler and
return the issues to the client so the UI can surface field-level errors.

### Why this matters

Wrong release dates break eligibility calculations. Wrong state codes silently
return empty resource lists. For a justice-involved population, silent failures
cause real harm — **validate at the boundary, always**.

### Available schemas

| Schema | Used by |
|---|---|
| `IntakeSchema` | `POST /api/intake` — primary user form |
| `ResourceQuerySchema` | `GET /api/resources` — resource lookup |
| `ActionPlanRequestSchema` | `POST /api/plan` — AI plan generation |

Run `npm test` from the repo root to execute the full schema test suite.
