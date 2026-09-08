-- GreenVest demo workspace seed.
-- Apply after 001_init.sql and 002_auth_profiles_and_rls.sql.
-- This function never creates auth users and never accepts a user_id argument.
-- It can only seed records for the authenticated caller identified by auth.uid().

create or replace function public.seed_my_greenvest_demo_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email text;
  current_user_name text;
  analysis_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to seed a GreenVest demo workspace.';
  end if;

  select
    email,
    coalesce(raw_user_meta_data ->> 'full_name', split_part(coalesce(email, 'GreenVest member'), '@', 1))
  into current_user_email, current_user_name
  from auth.users
  where id = current_user_id;

  insert into public.profiles (id, user_id, full_name, email)
  values (current_user_id, current_user_id, current_user_name, current_user_email)
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email;

  select id
  into analysis_id
  from public.land_analyses
  where user_id = current_user_id
    and current_land_use = 'GreenVest seeded demo scenario'
  order by created_at desc
  limit 1;

  if analysis_id is not null then
    return analysis_id;
  end if;

  -- These are existing GreenVest UI demo scenario values, not agricultural facts,
  -- field measurements, carbon-credit estimates or financial forecasts.
  insert into public.land_analyses (
    user_id,
    location,
    land_area,
    soil_type,
    rainfall,
    water_availability,
    investment_budget,
    investment_goal,
    current_land_use
  )
  values (
    current_user_id,
    'Coimbatore, Tamil Nadu',
    25,
    'Sandy Loam',
    'moderate',
    'limited',
    15,
    'balanced',
    'GreenVest seeded demo scenario'
  )
  returning id into analysis_id;

  insert into public.strategies (
    analysis_id, strategy_name, description, species, investment,
    carbon_estimate, return_estimate, water_requirement, risk_score,
    resilience_score, biodiversity_score, greenvest_score
  )
  values
    (
      analysis_id,
      'A. Carbon Forest',
      'Seeded demo scenario. Scenario-model output only.',
      '[{"id":"mixed-native","share":0.55},{"id":"bamboo","share":0.25},{"id":"silver-oak","share":0.2}]'::jsonb,
      9.3, 719, 20, 45, 18, 86, 85, 84
    ),
    (
      analysis_id,
      'B. Balanced Agroforestry',
      'Seeded demo scenario. Scenario-model output only.',
      '[{"id":"mixed-native","share":0.35},{"id":"silver-oak","share":0.2},{"id":"cashew","share":0.2},{"id":"bamboo","share":0.15},{"id":"mango","share":0.1}]'::jsonb,
      11.4, 612, 28, 54, 25, 87, 82, 87
    ),
    (
      analysis_id,
      'C. High-Value Plantation',
      'Seeded demo scenario. Scenario-model output only.',
      '[{"id":"mango","share":0.3},{"id":"coconut","share":0.2},{"id":"teak","share":0.3},{"id":"silver-oak","share":0.1},{"id":"eucalyptus","share":0.1}]'::jsonb,
      20.5, 63, 54, 110, 60, 68, 55, 76
    );

  insert into public.zoning_plans (
    analysis_id, carbon_percentage, income_percentage, biodiversity_percentage,
    conservation_percentage, carbon_estimate, return_estimate, water_usage, greenvest_score
  )
  values (analysis_id, 50, 30, 10, 10, 390, 32, 43, 82);

  insert into public.scenarios (
    analysis_id, scenario_name, budget, rainfall_change, water_change,
    carbon_price, carbon_priority, return_priority, carbon_result,
    return_result, risk_result, resilience_result, greenvest_score
  )
  values (
    analysis_id, 'Baseline - GreenVest seeded demo', 15, 0, 0,
    900, 50, 50, 612, 28, 25, 87, 87
  );

  insert into public.reports (user_id, analysis_id, report_name, report_data)
  values (
    current_user_id,
    analysis_id,
    'Balanced Agroforestry - Seeded Demo Plan',
    jsonb_build_object(
      'status', 'seeded-demo-scenario',
      'disclaimer', 'Scenario estimates only. Validate with site-specific soil, water, climate and market data before capital is committed.',
      'land', jsonb_build_object('location', 'Coimbatore, Tamil Nadu', 'area_acres', 25),
      'recommended_strategy', 'Balanced Agroforestry',
      'scenario_carbon_estimate_tco2', 612,
      'scenario_financial_estimate_inr_lakhs', 28,
      'greenvest_score', 87
    )
  );

  return analysis_id;
end;
$$;

revoke all on function public.seed_my_greenvest_demo_workspace() from public;
grant execute on function public.seed_my_greenvest_demo_workspace() to authenticated;