import { buildStrategies, validateLandInput } from "@/logic/engine";
import { computeOutcome } from "@/logic/outcome";
import { pickRecommended } from "@/logic/recommend";
import { defaultZoning, evaluateZoning } from "@/logic/zoning";
import type { LandInput, StrategyResult, ZoningAllocation } from "@/logic/types";
import {
  saveAnalysis as saveDemoAnalysis,
  hydrate as hydrateDemoAnalyses,
  deleteAnalysis as deleteDemoAnalysis,
} from "@/lib/repo";
import type { SavedAnalysis } from "@/lib/repo";
import { isExplicitDemoMode } from "@/lib/demoMode";
import { supabase } from "@/lib/supabaseClient";

export type DataSource = "supabase" | "demo" | "unavailable";

export interface DataResult<T> {
  data: T;
  source: DataSource;
  error?: string;
}

export interface ScenarioDraft {
  name: string;
  budget: number;
  rain: number;
  water: number;
  carbonPrice: number;
  carbonPrio: number;
  returnPrio: number;
  carbon: number;
  returnL: number;
  risk: number;
  resilience: number;
  score: number;
}

export interface SavedScenario extends ScenarioDraft {
  id: string;
  createdAt: number;
}

export interface SavedReport {
  id: string;
  analysisId: string;
  name: string;
  createdAt: number;
}

const scenarioKey = (analysisId: string) => `greenvest.scenarios.${analysisId}`;
const zoningKey = (analysisId: string) => `greenvest.zoning.${analysisId}`;
const reportKey = "greenvest.reports.v1";

function unavailable<T>(data: T, error: string): DataResult<T> {
  return { data, source: "unavailable", error };
}

function asNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function strategyIdFromName(name: unknown, strategies: StrategyResult[]) {
  const text = String(name || "").toLowerCase();
  return strategies.find((strategy) => text.includes(strategy.name.toLowerCase()))?.id || strategies[0]?.id || "";
}

function recordToLand(record: Record<string, unknown>): LandInput | null {
  const validation = validateLandInput({
    location: record.location,
    area: record.land_area,
    soil: record.soil_type,
    rainfallKey: record.rainfall,
    waterKey: record.water_availability,
    budgetLakhs: asNumber(record.investment_budget),
    goal: record.investment_goal,
  });
  return validation.valid ? validation.data || null : null;
}

function rowToSavedAnalysis(record: Record<string, unknown>): SavedAnalysis | null {
  const land = recordToLand(record);
  if (!land) return null;
  const generated = buildStrategies(land);
  const rows = Array.isArray(record.strategies) ? (record.strategies as Record<string, unknown>[]) : [];
  const selected = [...rows].sort(
    (a, b) => asNumber(b.greenvest_score) - asNumber(a.greenvest_score)
  )[0];
  const fallbackStrategy = pickRecommended(generated);
  const strategyId = strategyIdFromName(selected?.strategy_name, generated) || fallbackStrategy.id;
  const active = generated.find((strategy) => strategy.id === strategyId) || fallbackStrategy;
  const zoningRows = Array.isArray(record.zoning_plans) ? (record.zoning_plans as Record<string, unknown>[]) : [];
  const latestZoning = [...zoningRows].sort(
    (a, b) => new Date(String(b.created_at || 0)).getTime() - new Date(String(a.created_at || 0)).getTime()
  )[0];
  const recordZoning = record.zoning as ZoningAllocation | undefined;
  const zoning: ZoningAllocation = latestZoning
    ? {
        carbon: asNumber(latestZoning.carbon_percentage, defaultZoning.carbon),
        income: asNumber(latestZoning.income_percentage, defaultZoning.income),
        biodiversity: asNumber(latestZoning.biodiversity_percentage, defaultZoning.biodiversity),
        conservation: asNumber(latestZoning.conservation_percentage, defaultZoning.conservation),
      }
    : recordZoning || defaultZoning;

  return {
    id: String(record.id),
    createdAt: new Date(String(record.created_at || Date.now())).getTime(),
    land,
    strategyId,
    strategies: generated,
    score: asNumber(selected?.greenvest_score, active.metrics.total),
    carbon: asNumber(selected?.carbon_estimate, active.carbonBudgetT),
    returnL: asNumber(selected?.return_estimate, active.returnL),
    recommendedName: String(selected?.strategy_name || `${active.code}. ${active.name}`),
    code: active.code,
    zoning,
  };
}

async function withTimeout<T>(promise: PromiseLike<T>, timeout = 7000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error("request-timeout")), timeout)),
  ]);
}

async function currentAuthenticatedUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

/** Saves current engine output to Supabase or to the explicitly selected Demo Mode repository. */
export async function persistAnalysis(
  land: LandInput,
  strategies: StrategyResult[],
  selectedStrategyId: string,
  scenarioName = "Normal"
): Promise<DataResult<SavedAnalysis>> {
  const selected = strategies.find((strategy) => strategy.id === selectedStrategyId) || pickRecommended(strategies);
  const outcome = computeOutcome(land, selected, scenarioName, false);
  const defaultZoningResult = evaluateZoning(defaultZoning, land, scenarioName);

  const snapshot = (): SavedAnalysis => ({
    id: "",
    createdAt: Date.now(),
    land,
    strategyId: selected.id,
    strategies,
    score: outcome.total,
    carbon: outcome.carbonT,
    returnL: outcome.returnL,
    recommendedName: `${selected.code}. ${selected.name}`,
    code: selected.code,
    zoning: defaultZoning,
  });

  const saveDemo = () => {
    const preview = snapshot();
    return saveDemoAnalysis({
      land: preview.land,
      strategyId: preview.strategyId,
      strategies: preview.strategies,
      score: preview.score,
      carbon: preview.carbon,
      returnL: preview.returnL,
      recommendedName: preview.recommendedName,
      code: preview.code,
      zoning: preview.zoning,
    });
  };

  if (isExplicitDemoMode()) return { data: saveDemo(), source: "demo" };
  if (!supabase) return unavailable(snapshot(), "Unable to save your analysis because Supabase is not configured.");

  try {
    const user = await withTimeout(currentAuthenticatedUser());
    if (!user?.email_confirmed_at) return unavailable(snapshot(), "Please sign in with a verified account before saving an analysis.");

    const { data: analysis, error: analysisError } = await withTimeout(
      supabase
        .from("land_analyses")
        .insert({
          location: land.location,
          land_area: land.area,
          soil_type: land.soil,
          rainfall: land.rainfallKey,
          water_availability: land.waterKey,
          investment_budget: land.budgetLakhs,
          investment_goal: land.goal,
          current_land_use: "Not provided",
        })
        .select("id, created_at")
        .single()
    );
    if (analysisError || !analysis) throw analysisError || new Error("analysis-save-failed");

    const { error: strategyError } = await withTimeout(
      supabase.from("strategies").insert(
        strategies.map((strategy) => ({
          analysis_id: analysis.id,
          strategy_name: `${strategy.code}. ${strategy.name}`,
          description: strategy.tagline,
          species: strategy.species,
          investment: strategy.initCostL,
          carbon_estimate: strategy.carbonBudgetT,
          return_estimate: strategy.returnL,
          water_requirement: strategy.waterRequiredUnits,
          risk_score: strategy.riskScenario.sensitivityScore,
          resilience_score: strategy.metrics.resilience,
          biodiversity_score: strategy.metrics.biodiversity,
          greenvest_score: strategy.metrics.total,
        }))
      )
    );
    if (strategyError) throw strategyError;

    // A default plan makes every saved analysis complete before the user opens Zoning.
    const { error: zoningError } = await withTimeout(
      supabase.from("zoning_plans").insert({
        analysis_id: analysis.id,
        carbon_percentage: defaultZoning.carbon,
        income_percentage: defaultZoning.income,
        biodiversity_percentage: defaultZoning.biodiversity,
        conservation_percentage: defaultZoning.conservation,
        carbon_estimate: defaultZoningResult.carbonBudget,
        return_estimate: defaultZoningResult.returnL,
        water_usage: defaultZoningResult.reqWater,
        greenvest_score: defaultZoningResult.metrics.total,
      })
    );
    if (zoningError) throw zoningError;

    return {
      data: {
        id: analysis.id,
        createdAt: new Date(analysis.created_at).getTime(),
        land,
        strategyId: selected.id,
        strategies,
        score: outcome.total,
        carbon: outcome.carbonT,
        returnL: outcome.returnL,
        recommendedName: `${selected.code}. ${selected.name}`,
        code: selected.code,
        zoning: defaultZoning,
      },
      source: "supabase",
    };
  } catch {
    return unavailable(snapshot(), "Unable to save your analysis. Please try again.");
  }
}

/** Loads records for the verified Supabase user or the explicitly selected Demo Mode workspace. */
export async function loadAnalyses(): Promise<DataResult<SavedAnalysis[]>> {
  if (isExplicitDemoMode()) return { data: hydrateDemoAnalyses(), source: "demo" };
  if (!supabase) return unavailable([], "Unable to load analyses because Supabase is not configured.");

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("land_analyses")
        .select("id, location, land_area, soil_type, rainfall, water_availability, investment_budget, investment_goal, created_at, strategies(*)")
        .order("created_at", { ascending: false })
    );
    if (error) throw error;
    return {
      data: (data || [])
        .map((record) => rowToSavedAnalysis(record as Record<string, unknown>))
        .filter((analysis): analysis is SavedAnalysis => Boolean(analysis)),
      source: "supabase",
    };
  } catch {
    return unavailable([], "Unable to load your analyses. Please try again.");
  }
}

/** Fetches one owned analysis with its strategy rows before restoring the decision workspace. */
export async function loadAnalysis(id: string): Promise<DataResult<SavedAnalysis | null>> {
  if (isExplicitDemoMode() && id.startsWith("an_")) {
    return { data: hydrateDemoAnalyses().find((analysis) => analysis.id === id) || null, source: "demo" };
  }
  if (!supabase) return unavailable(null, "Unable to load this analysis because Supabase is not configured.");

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("land_analyses")
        .select("id, location, land_area, soil_type, rainfall, water_availability, investment_budget, investment_goal, created_at, strategies(*), scenarios(*), zoning_plans(*)")
        .eq("id", id)
        .single()
    );
    if (error || !data) throw error || new Error("analysis-not-found");
    const analysis = rowToSavedAnalysis(data as Record<string, unknown>);
    if (!analysis) throw new Error("analysis-record-has-insufficient-data");
    return { data: analysis, source: "supabase" };
  } catch {
    return unavailable(null, "Unable to load this analysis. Please try again.");
  }
}

export async function removeAnalysis(id: string): Promise<DataResult<boolean>> {
  if (isExplicitDemoMode() && id.startsWith("an_")) {
    deleteDemoAnalysis(id);
    return { data: true, source: "demo" };
  }
  if (!supabase) return unavailable(false, "Unable to delete this analysis because Supabase is not configured.");
  try {
    const { error } = await withTimeout(supabase.from("land_analyses").delete().eq("id", id));
    if (error) throw error;
    return { data: true, source: "supabase" };
  } catch {
    return unavailable(false, "Unable to delete this analysis. Please try again.");
  }
}

function setLocalZoning(analysisId: string, zoning: ZoningAllocation) {
  try {
    window.localStorage.setItem(zoningKey(analysisId), JSON.stringify(zoning));
  } catch {
    // Demo data stays usable even when browser storage is unavailable.
  }
}

export async function persistZoning(
  analysisId: string,
  zoning: ZoningAllocation,
  land: LandInput,
  scenarioName = "Normal"
): Promise<DataResult<ZoningAllocation>> {
  const local = () => {
    setLocalZoning(analysisId, zoning);
    return zoning;
  };
  if (isExplicitDemoMode() && analysisId.startsWith("an_")) return { data: local(), source: "demo" };
  if (!supabase) return unavailable(zoning, "Unable to save zoning changes because Supabase is not configured.");

  try {
    const result = evaluateZoning(zoning, land, scenarioName);
    const { error } = await withTimeout(
      supabase.from("zoning_plans").insert({
        analysis_id: analysisId,
        carbon_percentage: zoning.carbon,
        income_percentage: zoning.income,
        biodiversity_percentage: zoning.biodiversity,
        conservation_percentage: zoning.conservation,
        carbon_estimate: result.carbonBudget,
        return_estimate: result.returnL,
        water_usage: result.reqWater,
        greenvest_score: result.metrics.total,
      })
    );
    if (error) throw error;
    return { data: zoning, source: "supabase" };
  } catch {
    return unavailable(zoning, "Unable to save zoning changes. Please try again.");
  }
}

function localScenarios(analysisId: string): SavedScenario[] {
  try {
    const raw = window.localStorage.getItem(scenarioKey(analysisId));
    return raw ? (JSON.parse(raw) as SavedScenario[]) : [];
  } catch {
    return [];
  }
}

function setLocalScenarios(analysisId: string, scenarios: SavedScenario[]) {
  try {
    window.localStorage.setItem(scenarioKey(analysisId), JSON.stringify(scenarios));
  } catch {
    // Local persistence is optional in Demo Mode.
  }
}

export async function persistScenario(analysisId: string, draft: ScenarioDraft): Promise<DataResult<SavedScenario>> {
  const local = (): SavedScenario => {
    const record = { ...draft, id: `sc_${Date.now()}`, createdAt: Date.now() };
    setLocalScenarios(analysisId, [record, ...localScenarios(analysisId)]);
    return record;
  };
  if (isExplicitDemoMode() && analysisId.startsWith("an_")) return { data: local(), source: "demo" };
  if (!supabase) return unavailable({ ...draft, id: "", createdAt: Date.now() }, "Unable to save this scenario because Supabase is not configured.");

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("scenarios")
        .insert({
          analysis_id: analysisId,
          scenario_name: draft.name,
          budget: draft.budget,
          rainfall_change: draft.rain,
          water_change: draft.water,
          carbon_price: draft.carbonPrice,
          carbon_priority: draft.carbonPrio,
          return_priority: draft.returnPrio,
          carbon_result: draft.carbon,
          return_result: draft.returnL,
          risk_result: draft.risk,
          resilience_result: draft.resilience,
          greenvest_score: draft.score,
        })
        .select()
        .single()
    );
    if (error || !data) throw error || new Error("scenario-save-failed");
    return {
      data: {
        ...draft,
        id: data.id,
        createdAt: new Date(data.created_at).getTime(),
      },
      source: "supabase",
    };
  } catch {
    return unavailable({ ...draft, id: "", createdAt: Date.now() }, "Unable to save this scenario. Please try again.");
  }
}

export async function loadScenarios(analysisId: string): Promise<DataResult<SavedScenario[]>> {
  if (isExplicitDemoMode() && analysisId.startsWith("an_")) return { data: localScenarios(analysisId), source: "demo" };
  if (!supabase) return unavailable([], "Unable to load saved scenarios because Supabase is not configured.");
  try {
    const { data, error } = await withTimeout(
      supabase.from("scenarios").select("*").eq("analysis_id", analysisId).order("created_at", { ascending: false })
    );
    if (error) throw error;
    return {
      data: (data || []).map((row) => ({
        id: row.id,
        createdAt: new Date(row.created_at).getTime(),
        name: row.scenario_name || "Saved scenario",
        budget: asNumber(row.budget),
        rain: asNumber(row.rainfall_change),
        water: asNumber(row.water_change),
        carbonPrice: asNumber(row.carbon_price),
        carbonPrio: asNumber(row.carbon_priority),
        returnPrio: asNumber(row.return_priority),
        carbon: asNumber(row.carbon_result),
        returnL: asNumber(row.return_result),
        risk: asNumber(row.risk_result),
        resilience: asNumber(row.resilience_result),
        score: asNumber(row.greenvest_score),
      })),
      source: "supabase",
    };
  } catch {
    return unavailable([], "Unable to load saved scenarios. Please try again.");
  }
}

export async function persistReport(analysisId: string, name: string, reportData: Record<string, unknown>): Promise<DataResult<boolean>> {
  const saveDemo = () => {
    try {
      const existing = JSON.parse(window.localStorage.getItem(reportKey) || "[]") as Record<string, unknown>[];
      window.localStorage.setItem(reportKey, JSON.stringify([{ id: `rp_${Date.now()}`, analysisId, name, reportData, createdAt: Date.now() }, ...existing]));
    } catch {
      // The visible report remains available even if local storage is unavailable.
    }
    return true;
  };
  if (isExplicitDemoMode() && analysisId.startsWith("an_")) return { data: saveDemo(), source: "demo" };
  if (!supabase) return unavailable(false, "Unable to save this report because Supabase is not configured.");
  try {
    const user = await withTimeout(currentAuthenticatedUser());
    if (!user?.email_confirmed_at) return unavailable(false, "Please sign in with a verified account before saving a report.");
    const { error } = await withTimeout(
      supabase.from("reports").insert({
        analysis_id: analysisId,
        report_name: name,
        report_data: reportData,
      })
    );
    if (error) throw error;
    return { data: true, source: "supabase" };
  } catch {
    return unavailable(false, "Unable to save this report. Please try again.");
  }
}

export async function loadReports(): Promise<DataResult<SavedReport[]>> {
  const local = (): SavedReport[] => {
    try {
      const records = JSON.parse(window.localStorage.getItem(reportKey) || "[]") as Array<Record<string, unknown>>;
      return records.map((record) => ({
        id: String(record.id),
        analysisId: String(record.analysisId || ""),
        name: String(record.name || "GreenVest Investment Plan"),
        createdAt: asNumber(record.createdAt, Date.now()),
      }));
    } catch {
      return [];
    }
  };

  if (isExplicitDemoMode()) return { data: local(), source: "demo" };
  if (!supabase) return unavailable([], "Unable to load reports because Supabase is not configured.");
  try {
    const { data, error } = await withTimeout(
      supabase.from("reports").select("id, analysis_id, report_name, created_at").order("created_at", { ascending: false })
    );
    if (error) throw error;
    return {
      data: (data || []).map((record) => ({
        id: record.id,
        analysisId: record.analysis_id || "",
        name: record.report_name || "GreenVest Investment Plan",
        createdAt: new Date(record.created_at).getTime(),
      })),
      source: "supabase",
    };
  } catch {
    return unavailable([], "Unable to load reports. Please try again.");
  }
}