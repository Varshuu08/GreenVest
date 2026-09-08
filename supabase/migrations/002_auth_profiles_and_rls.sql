-- GreenVest auth/profile hardening.
-- Apply after 001_init.sql. This migration replaces the initial broad child
-- policies with explicit SELECT / INSERT / UPDATE / DELETE ownership checks.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, full_name, email)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'GreenVest member'), '@', 1)),
    new.email
  )
  on conflict (id) do update set
    user_id = excluded.user_id,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep the account's profile row current for users created before this trigger.
insert into public.profiles (id, user_id, full_name, email)
select
  id,
  id,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(coalesce(email, 'GreenVest member'), '@', 1)),
  email
from auth.users
on conflict (id) do nothing;

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "analyses select own" on public.land_analyses;
drop policy if exists "analyses insert own" on public.land_analyses;
drop policy if exists "analyses update own" on public.land_analyses;
drop policy if exists "analyses delete own" on public.land_analyses;
drop policy if exists "strategies ancestor" on public.strategies;
drop policy if exists "zoning ancestor" on public.zoning_plans;
drop policy if exists "scenarios ancestor" on public.scenarios;
drop policy if exists "reports select own" on public.reports;
drop policy if exists "reports insert own" on public.reports;
drop policy if exists "reports delete own" on public.reports;

create policy "profiles select own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles delete own" on public.profiles for delete using (auth.uid() = user_id);

create policy "analyses select own" on public.land_analyses for select using (auth.uid() = user_id);
create policy "analyses insert own" on public.land_analyses for insert with check (auth.uid() = user_id);
create policy "analyses update own" on public.land_analyses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "analyses delete own" on public.land_analyses for delete using (auth.uid() = user_id);

create policy "strategies select own analysis" on public.strategies for select using (
  exists (select 1 from public.land_analyses a where a.id = strategies.analysis_id and a.user_id = auth.uid())
);
create policy "strategies insert own analysis" on public.strategies for insert with check (
  exists (select 1 from public.land_analyses a where a.id = strategies.analysis_id and a.user_id = auth.uid())
);
create policy "strategies update own analysis" on public.strategies for update using (
  exists (select 1 from public.land_analyses a where a.id = strategies.analysis_id and a.user_id = auth.uid())
) with check (
  exists (select 1 from public.land_analyses a where a.id = strategies.analysis_id and a.user_id = auth.uid())
);
create policy "strategies delete own analysis" on public.strategies for delete using (
  exists (select 1 from public.land_analyses a where a.id = strategies.analysis_id and a.user_id = auth.uid())
);

create policy "scenarios select own analysis" on public.scenarios for select using (
  exists (select 1 from public.land_analyses a where a.id = scenarios.analysis_id and a.user_id = auth.uid())
);
create policy "scenarios insert own analysis" on public.scenarios for insert with check (
  exists (select 1 from public.land_analyses a where a.id = scenarios.analysis_id and a.user_id = auth.uid())
);
create policy "scenarios update own analysis" on public.scenarios for update using (
  exists (select 1 from public.land_analyses a where a.id = scenarios.analysis_id and a.user_id = auth.uid())
) with check (
  exists (select 1 from public.land_analyses a where a.id = scenarios.analysis_id and a.user_id = auth.uid())
);
create policy "scenarios delete own analysis" on public.scenarios for delete using (
  exists (select 1 from public.land_analyses a where a.id = scenarios.analysis_id and a.user_id = auth.uid())
);

create policy "zoning select own analysis" on public.zoning_plans for select using (
  exists (select 1 from public.land_analyses a where a.id = zoning_plans.analysis_id and a.user_id = auth.uid())
);
create policy "zoning insert own analysis" on public.zoning_plans for insert with check (
  exists (select 1 from public.land_analyses a where a.id = zoning_plans.analysis_id and a.user_id = auth.uid())
);
create policy "zoning update own analysis" on public.zoning_plans for update using (
  exists (select 1 from public.land_analyses a where a.id = zoning_plans.analysis_id and a.user_id = auth.uid())
) with check (
  exists (select 1 from public.land_analyses a where a.id = zoning_plans.analysis_id and a.user_id = auth.uid())
);
create policy "zoning delete own analysis" on public.zoning_plans for delete using (
  exists (select 1 from public.land_analyses a where a.id = zoning_plans.analysis_id and a.user_id = auth.uid())
);

create policy "reports select own" on public.reports for select using (auth.uid() = user_id);
create policy "reports insert own" on public.reports for insert with check (auth.uid() = user_id);
create policy "reports update own" on public.reports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports delete own" on public.reports for delete using (auth.uid() = user_id);

-- Auto-maintain analysis timestamps on cloud edits.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_land_analyses_updated_at on public.land_analyses;
create trigger set_land_analyses_updated_at
  before update on public.land_analyses
  for each row execute procedure public.set_updated_at();