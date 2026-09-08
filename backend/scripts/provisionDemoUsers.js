import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Backend-only setup utility.
 *
 * It creates demo Auth users only when executed with SUPABASE_SERVICE_ROLE_KEY
 * in the server environment. The key is never imported by the frontend.
 * It then invokes the same user-scoped database seed function for each user.
 */

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const users = [
  {
    email: process.env.DEMO_USER_1_EMAIL,
    password: process.env.DEMO_USER_1_PASSWORD,
    fullName: process.env.DEMO_USER_1_NAME || "Aarav Kumar",
  },
  {
    email: process.env.DEMO_USER_2_EMAIL,
    password: process.env.DEMO_USER_2_PASSWORD,
    fullName: process.env.DEMO_USER_2_NAME || "Meera Iyer",
  },
  {
    email: process.env.DEMO_USER_3_EMAIL,
    password: process.env.DEMO_USER_3_PASSWORD,
    fullName: process.env.DEMO_USER_3_NAME || "Dev Shah",
  },
].filter((user) => user.email || user.password);

if (!url || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the backend environment before provisioning users.");
}

if (users.length === 0 || users.some((user) => !user.email || !user.password)) {
  throw new Error("Set complete DEMO_USER_1/2/3_EMAIL and DEMO_USER_1/2/3_PASSWORD values before provisioning users.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedWorkspace(userId) {
  const { data: existingAnalysis, error: existingError } = await admin
    .from("land_analyses")
    .select("id")
    .eq("user_id", userId)
    .eq("current_land_use", "GreenVest seeded demo scenario")
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingAnalysis?.id) return existingAnalysis.id;

  const { data: analysis, error: analysisError } = await admin
    .from("land_analyses")
    .insert({
      user_id: userId,
      location: "Coimbatore, Tamil Nadu",
      land_area: 25,
      soil_type: "Sandy Loam",
      rainfall: "moderate",
      water_availability: "limited",
      investment_budget: 15,
      investment_goal: "balanced",
      current_land_use: "GreenVest seeded demo scenario",
    })
    .select("id")
    .single();
  if (analysisError || !analysis) throw analysisError || new Error("Unable to seed analysis.");

  const seedResults = await Promise.all([
    admin.from("strategies").insert([
      {
        analysis_id: analysis.id,
        strategy_name: "A. Carbon Forest",
        description: "Seeded demo scenario. Scenario-model output only.",
        species: [{ id: "mixed-native", share: 0.55 }, { id: "bamboo", share: 0.25 }, { id: "silver-oak", share: 0.2 }],
        investment: 9.3,
        carbon_estimate: 719,
        return_estimate: 20,
        water_requirement: 45,
        risk_score: 18,
        resilience_score: 86,
        biodiversity_score: 85,
        greenvest_score: 84,
      },
      {
        analysis_id: analysis.id,
        strategy_name: "B. Balanced Agroforestry",
        description: "Seeded demo scenario. Scenario-model output only.",
        species: [{ id: "mixed-native", share: 0.35 }, { id: "silver-oak", share: 0.2 }, { id: "cashew", share: 0.2 }, { id: "bamboo", share: 0.15 }, { id: "mango", share: 0.1 }],
        investment: 11.4,
        carbon_estimate: 612,
        return_estimate: 28,
        water_requirement: 54,
        risk_score: 25,
        resilience_score: 87,
        biodiversity_score: 82,
        greenvest_score: 87,
      },
      {
        analysis_id: analysis.id,
        strategy_name: "C. High-Value Plantation",
        description: "Seeded demo scenario. Scenario-model output only.",
        species: [{ id: "mango", share: 0.3 }, { id: "coconut", share: 0.2 }, { id: "teak", share: 0.3 }, { id: "silver-oak", share: 0.1 }, { id: "eucalyptus", share: 0.1 }],
        investment: 20.5,
        carbon_estimate: 63,
        return_estimate: 54,
        water_requirement: 110,
        risk_score: 60,
        resilience_score: 68,
        biodiversity_score: 55,
        greenvest_score: 76,
      },
    ]),
    admin.from("zoning_plans").insert({
      analysis_id: analysis.id,
      carbon_percentage: 50,
      income_percentage: 30,
      biodiversity_percentage: 10,
      conservation_percentage: 10,
      carbon_estimate: 390,
      return_estimate: 32,
      water_usage: 43,
      greenvest_score: 82,
    }),
    admin.from("scenarios").insert({
      analysis_id: analysis.id,
      scenario_name: "Baseline - GreenVest seeded demo",
      budget: 15,
      rainfall_change: 0,
      water_change: 0,
      carbon_price: 900,
      carbon_priority: 50,
      return_priority: 50,
      carbon_result: 612,
      return_result: 28,
      risk_result: 25,
      resilience_result: 87,
      greenvest_score: 87,
    }),
    admin.from("reports").insert({
      user_id: userId,
      analysis_id: analysis.id,
      report_name: "Balanced Agroforestry - Seeded Demo Plan",
      report_data: {
        status: "seeded-demo-scenario",
        disclaimer: "Scenario estimates only. Validate with site-specific soil, water, climate and market data before capital is committed.",
        recommended_strategy: "Balanced Agroforestry",
        scenario_carbon_estimate_tco2: 612,
        scenario_financial_estimate_inr_lakhs: 28,
        greenvest_score: 87,
      },
    }),
  ]);
  const failedWrite = seedResults.find((result) => result.error);
  if (failedWrite?.error) throw failedWrite.error;

  return analysis.id;
}

const { data: existingData, error: existingError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (existingError) throw existingError;

for (const demoUser of users) {
  const email = demoUser.email.trim().toLowerCase();
  let user = existingData.users.find((item) => item.email?.toLowerCase() === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: demoUser.password,
      email_confirm: true,
      user_metadata: { full_name: demoUser.fullName },
    });
    if (error || !data.user) throw error || new Error(`Unable to create ${email}`);
    user = data.user;
    console.log(`Created demo user: ${email}`);
  } else {
    console.log(`Demo user already exists: ${email}`);
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: user.id, user_id: user.id, full_name: demoUser.fullName, email }, { onConflict: "id" });
  if (profileError) throw profileError;

  const analysisId = await seedWorkspace(user.id);
  console.log(`Seeded GreenVest workspace for ${email}: ${analysisId}`);
}

console.log("Demo Auth users, profiles, analyses, strategies, zoning plans, scenarios and reports are ready.");