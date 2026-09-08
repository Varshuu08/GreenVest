-- ── GreenVest schema (Supabase PostgreSQL) ─────────────────
-- Run inside the Supabase SQL editor. RLS ensures a user can
-- only read/write their own rows.

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  user_id uuid references auth.users on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- LAND ANALYSES
create table public.land_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  location text,
  land_area numeric,
  soil_type text,
  rainfall text,
  water_availability text,
  investment_budget numeric,
  investment_goal text,
  current_land_use text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- STRATEGIES
create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.land_analyses on delete cascade not null,
  strategy_name text,
  description text,
  species jsonb,
  investment numeric,
  carbon_estimate numeric,
  return_estimate numeric,
  water_requirement numeric,
  risk_score numeric,
  resilience_score numeric,
  biodiversity_score numeric,
  greenvest_score numeric,
  created_at timestamptz default now()
);

-- ZONING PLANS
create table public.zoning_plans (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.land_analyses on delete cascade not null,
  carbon_percentage numeric,
  income_percentage numeric,
  biodiversity_percentage numeric,
  conservation_percentage numeric,
  carbon_estimate numeric,
  return_estimate numeric,
  water_usage numeric,
  greenvest_score numeric,
  created_at timestamptz default now()
);

-- SAVED SCENARIOS
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.land_analyses on delete cascade not null,
  scenario_name text,
  budget numeric,
  rainfall_change numeric,
  water_change numeric,
  carbon_price numeric,
  carbon_priority numeric,
  return_priority numeric,
  carbon_result numeric,
  return_result numeric,
  risk_result numeric,
  resilience_result numeric,
  greenvest_score numeric,
  created_at timestamptz default now()
);

-- INVESTMENT REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  analysis_id uuid references public.land_analyses on delete cascade,
  report_name text,
  report_data jsonb,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.land_analyses enable row level security;
alter table public.strategies enable row level security;
alter table public.zoning_plans enable row level security;
alter table public.scenarios enable row level security;
alter table public.reports enable row level security;

-- users may only touch their own profile
create policy "profiles select own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = user_id);

-- analyses scoped to owner
create policy "analyses select own" on public.land_analyses for select using (auth.uid() = user_id);
create policy "analyses insert own" on public.land_analyses for insert with check (auth.uid() = user_id);
create policy "analyses update own" on public.land_analyses for update using (auth.uid() = user_id);
create policy "analyses delete own" on public.land_analyses for delete using (auth.uid() = user_id);

-- children inherit access via their analysis (permissive join helper)
create policy "strategies ancestor" on public.strategies
  for all using (
    exists (
      select 1 from public.land_analyses a
      where a.id = strategies.analysis_id and a.user_id = auth.uid()
    )
  );
create policy "zoning ancestor" on public.zoning_plans
  for all using (
    exists (select 1 from public.land_analyses a where a.id = zoning_plans.analysis_id and a.user_id = auth.uid())
  );
create policy "scenarios ancestor" on public.scenarios
  for all using (
    exists (select 1 from public.land_analyses a where a.id = scenarios.analysis_id and a.user_id = auth.uid())
  );

create policy "reports select own" on public.reports for select using (auth.uid() = user_id);
create policy "reports insert own" on public.reports for insert with check (auth.uid() = user_id);
create policy "reports delete own" on public.reports for delete using (auth.uid() = user_id);

-- ── helpful index ──────────────────────────────────────────
create index idx_analyses_user on public.land_analyses (user_id, created_at desc);
