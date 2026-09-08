# 🌱 GreenVest

> **Stress-test your land investment before you invest.**
> Reference-screened plantation planning with transparent **scenario estimates** for carbon, finance, water fit, climate sensitivity, biodiversity and risk.

---

## Problem
Investors assess land for planting with intuition, not data. Result: monocultures that erode soil,
overshoot groundwater, or perish in a changed climate — **after** money is already down.

## Solution
GreenVest is a decision-support platform that walks an investor from **one land parcel** to a
defensible, explainable plantation plan:

1. INPUT → 2. ANALYZE → 3. RECOMMEND → 4. STRESS-TEST → 5. SIMULATE → 6. EXPLAIN → 7. DECIDE

It generates three strategies (Carbon Forest · Balanced Agroforestry · High-Value Plantation),
scores them across six dimensions under your goal, stress-tests climate & market scenarios,
optimises land zoning on a water budget, surfaces risks/red flags, and answers “why / why-not”
with numbers — not vibes. A contextual **AI Advisor** explains results using the engine's output,
never inventing calculations.

> ⚠️ **All carbon, cost and return figures are SIMULATED estimates for decision support** and are
> not guarantees of carbon-credit issuance, plantation performance or investment returns.

## Features
- Land analysis form → animated analysis runner
- Rule-based recommendation + scoring engine (no random AI numbers)
- Three interactive strategies with “Why this / Why not” explanations
- Land Zoning optimizer (always totals 100%, animated map)
- Water-budget optimiser (available vs required, live constraint warnings)
- Climate Stress Test (Normal · Drier · Hotter · Water Scarcity · Heavy Rain) + Worst-Case
- What-if Simulator (budget, rainfall, water, carbon price, priorities) — no page refresh
- Strategy comparison charts (Recharts)
- Investment Report + print view
- Save / Duplicate / Delete analyses → **My Analyses** history + Portfolio aggregates
- GreenVest AI Advisor (contextual, mock engine with Gemini-ready seam)
- Final **Decision Summary** card: Recommendation Confidence indicator, Key Strengths & Key Risks
- **Illustrative 10-year investment journey** timeline
- **Start Demo** guided auto-demo overlay (Pause / Skip / Restart / step progress) on the Landing hero
- Plans page (Free / Pro / Enterprise — demo pricing)
- Toast notifications, animated counters/charts, glassmorphic UI

## Tech Stack
- **Frontend:** React 19 · Vite · TypeScript · Tailwind CSS · Framer Motion · Recharts · React Router
- **Decision layer:** deterministic TS engine in `src/logic/` + `src/data/`
- **Backend (Phase-3 scaffold):** Node.js · Express (`backend/`)
- **Database / Auth:** Supabase PostgreSQL + Auth (`supabase/migrations/`)

## Architecture
High-level flow — the UI is kept decoupled from any AI:

```
UI / pages
   │  reads
SimulationContext (single source of truth for the active land/strategies/scenario)
   │  calls
Logic layer: engine.ts · outcome.ts · recommend.ts · advisor.ts · zoning.ts
   │  data
src/data/agronomy/ · shared/greenvest-model-spec.json · src/logic/types.ts
```

### Agricultural Data Architecture

GreenVest deliberately separates three kinds of information:

```
Reference facts                 Scenario assumptions                 Engine outputs
TNAU / ICAR source metadata    Carbon/cost/water coefficients        Scenario Carbon Estimate
Soil/drainage notes             Stress-test multipliers               Scenario Financial Estimate
Broad climate guidance          Strategy mix and score weights        Modeled Water/Biodiversity/Risk scores
```

Canonical data lives in `src/data/agronomy/`:

- `contracts.ts` — normalized types for reference facts, provenance, assumptions and outputs.
- `sources.ts` / `referenceFacts.ts` — traceable TNAU and ICAR screening references.
- `soil.ts`, `climate.ts`, `water.ts`, `locations.ts` — controlled vocabulary and location-data status.
- `species.ts`, `carbon.ts`, `economics.ts`, `modelAssumptions.ts` — species references and explicit model assumptions.
- `validation.ts` / `importBoundary.ts` — provider-neutral validation and normalization for future CSV, Excel, JSON, API or database records.
- `shared/greenvest-model-spec.json` — the one canonical coefficient/specification used by both frontend and backend engines.

No external agricultural dataset is imported yet. A user-entered location is not treated as parcel-level climate or soil evidence; this lowers the strategy's reference coverage rather than inventing a location profile.

> Agricultural facts are reference-based screening guidance. Carbon, financial, maintenance, water-index, biodiversity, resilience and risk values are scenario-model estimates—not field measurements, irrigation schedules, carbon-credit estimates or guaranteed outcomes.

Phase-3 goal wiring:

```
UI
│ fetch / axios
Express API (backend/)
│ authMiddleware (verifies Supabase user via token)
Supabase (RLS-gated PostgreSQL)
```

### Frontend structure
```
src/
  pages/            landing, dashboard, analyze, strategies, stress-test,
                    simulator, zoning, recommendation, ai-advisor,
                    analyses (history+portfolio), report, plans, settings
  components/
    layout/         sidebar, topbar (demo logo/brand, nav), app shell
    ui/             design system (GlassCard, MetricCard, ScoreRing, …)
    engines/        analysis loader, score breakdown, assumptions modal, status
  context/          SimulationContext, ToastContext, AuthContext
  logic/            engine, outcome, scenarios, recommend, advisor, zoning, types
  data/
    agronomy/        normalized reference data, model assumptions, provenance and import validation
    demo.ts          isolated interface/demo scenario values
    plantations.ts   compatibility facade for the centralized agronomy catalog
  lib/              demo repository (localStorage persistence seam)
```

## Database Schema
Tables (see `supabase/migrations/001_init.sql`):
`profiles`, `land_analyses`, `strategies`, `zoning_plans`, `scenarios`, `reports`.

All tables enable **Row Level Security**, scoping tables to `auth.uid()`; child rows inherit access
through their owning analysis. Service-role keys live only on the backend.

## API Endpoints (Express)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze-land` | compute + persist analysis & strategies |
| GET  | `/api/analyses` | list my analyses |
| GET  | `/api/analyses/:id` | full analysis (land + strategies + zoning + scenarios) |
| DELETE | `/api/analyses/:id` | delete an analysis |
| POST | `/api/scenarios` | save a scenario |
| POST | `/api/zoning` | save a zoning plan |
| POST | `/api/reports` | generate + store a report |
| GET  | `/api/profile` | current profile |

All `/api/*` are protected by `requireAuth` (Supabase user token).

## Environment Setup
Copy `.env.example` → `.env` and fill:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

> No keys are hardcoded and nothing sensitive is written to localStorage. The frontend only ever
> holds the public publishable/anon key. Backend-only values live in `backend/.env` and are never bundled by Vite.

### Run frontend
```bash
npm install
npm run dev        # http://localhost:5173
```

### Run backend
```bash
cd backend
npm install
npm run dev        # http://localhost:4000
```

### Configure Supabase
1. Create a project, copy the project URL and browser-safe publishable key.
2. Create a local root `.env` from `.env.example` and set only `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY` for your new project. The repository does not contain a project-specific `.env`.
3. Open **SQL Editor** → run `supabase/migrations/001_init.sql`, `supabase/migrations/002_auth_profiles_and_rls.sql`, `supabase/migrations/003_demo_seed_workspace.sql`, `supabase/migrations/004_lock_demo_seed_function.sql`, then `supabase/migrations/005_database_owned_user_defaults.sql`.
4. Enable **Auth → Email** with Email/Password sign-in and keep **Confirm email** enabled. New GreenVest accounts must verify their email before protected workspace access.
5. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:5173` for local development and add `http://localhost:5173/auth/callback` plus `http://localhost:5173/reset-password` to Redirect URLs. Add your production URLs after deployment; none are invented by this project.
6. Configure your hosting provider to rewrite client routes such as `/auth/callback` and `/reset-password` to `index.html`; Vite handles this locally, while a static production host needs its normal SPA fallback rule.

### Seed Demo Users And Records
1. Apply `supabase/migrations/003_demo_seed_workspace.sql` after the first two migrations. It adds a safe `seed_my_greenvest_demo_workspace()` function for a signed-in user and does not create Auth users.
2. To provision three optional development demo accounts plus a complete seeded workspace in every GreenVest table, create `backend/.env` using `backend/.env.example`.
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and complete `DEMO_USER_1/2/3_EMAIL` plus `DEMO_USER_1/2/3_PASSWORD` values. Use strong, unique non-production passwords.
4. Run `cd backend && npm install && node scripts/provisionDemoUsers.js`.

The provisioning script uses the Supabase Admin API only in the backend environment and creates profiles, land analyses, strategies, zoning plans, scenarios, and reports. It is idempotent: rerunning it reuses an existing demo user and skips an existing seeded workspace. Do not run this developer seed process against production users. Migration `004_lock_demo_seed_function.sql` removes browser access to the optional SQL seed helper.

> **Auth + Demo Mode:** GreenVest uses Supabase email/password authentication with verified-email-only access when configured. If Supabase is unavailable, real authentication shows a friendly connection/configuration error. **Demo Mode never starts automatically**; visitors must explicitly choose “Explore Demo Mode”, which creates a separate local demo session.

## Enabling AI
The AI Advisor uses a **mock, data-grounded engine** by default (`src/logic/advisor.ts`). When
you set `AI_API_KEY`/`AI_API_URL`, swap the mock with a request in `logic/advisor.ts`. Keep
numbers from the decision engine and send them as structured context to the model — the model
should only *explain*, never calculate.

## Demo Instructions
1. Landing → press **▶ Start Demo** for the guided 60–90s product walkthrough (or **Explore GreenVest** to go direct).
2. Provide land (pre-filled: Coimbatore · 25 acres · Sandy Loam · Moderate · Limited · ₹15L) in **Analyze Land**.
3. **Analyze My Land** → watch the guided sequence → results Dashboard.
4. **Strategies** → pick a strategy, read “Why / Why not”, check the **Decision Summary** (confidence + strengths/risks + 10-yr journey), view assumptions.
5. **Stress Test** → change climate scenarios; watch carbon, return, risk and resilience cascade.
6. **Simulator / Zoning** → move sliders (no refresh); manage the water budget.
7. **Recommendation / Report** → final explainable decision + “Generate Investment Plan”.
8. **Save Analysis** → open **My Analyses** → portfolio aggregates.
9. Ask the **AI Advisor** “Why was this strategy recommended?” — it answers from live context.

## Roadmap
- Add production monitoring, Supabase Edge Functions, and background report generation
- Remote-sensing / soil-telemetry inputs and calibrated biomass models
- Client-side PDF report export with visual charts & branding
- Two-scenario comparison view
- Real carbon-credit & market pricing APIs (as integrations, off-critical-path)
- Payments for Pro/Enterprise via a provider (currently demo tiers)

## Limitations
GreenVest is a decision-support prototype. Values are simulated estimates; always validate against
local agronomy data and professional advice before deploying capital. No part of this product
guarantees carbon-credit issuance, plantation outcomes or investment returns.
