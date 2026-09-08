import type { ClimateScenario, LandInput, StrategyResult, RiskLevel } from "@/logic/types";
import { CLIMATE_SCENARIOS, WORST_CASE } from "@/logic/scenarios";
import { scoreStrategy, RISK_ORDER, riskLabelFor } from "@/logic/engine";
import { MODEL_ASSUMPTIONS } from "@/data/agronomy";

export interface LiveOutcome {
  scenario: ClimateScenario;
  name: string;
  carbonT: number;
  returnL: number;
  reqWater: number;
  availWater: number;
  riskRaw: number;
  riskLevel: RiskLevel;
  resiliencePct: number;
  total: number;
  feasible: boolean;
  note: string;
}

const NOTE_BY_CASE: Record<string, string[]> = {
  "Drier Climate": [
    "This illustrative lower-rainfall assumption reduces the model's growth input, so the Scenario Carbon Estimate declines.",
    "Validate seasonal moisture, establishment irrigation and drainage with local records before acting.",
  ],
  "Hotter Climate": [
    "This illustrative heat assumption increases modeled water sensitivity and adjusts the Scenario Financial Estimate.",
    "It is a stress-test input, not a site-specific heat forecast.",
  ],
  "Water Scarcity": [
    "The scenario reduces the internal water-availability index, narrowing model feasibility for higher-demand blocks.",
    "Consider reviewing lower-demand species mixes, moisture conservation and local water planning.",
  ],
  "Heavy Rainfall": [
    "This illustrative high-rainfall assumption tests drainage and saturation sensitivity in the model.",
    "Review field drainage, slope and waterlogging history; the model does not measure them.",
  ],
  Normal: [
    "Baseline scenario assumptions are active. This is not a performance forecast.",
  ],
};

export function computeOutcome(
  land: LandInput,
  strat: StrategyResult,
  scenarioName: string,
  worstOn: boolean
): LiveOutcome {
  const sc = CLIMATE_SCENARIOS.find((s) => s.name === scenarioName) ?? CLIMATE_SCENARIOS[0];
  const wc = worstOn ? WORST_CASE : null;

  // Carbon-price assumptions affect only the financial scenario. They do not
  // change the modeled carbon quantity for the same planting scenario.
  const carbonT = Math.round(strat.carbonBudgetT * sc.carbonMul);
  const returnL = Math.round(strat.returnL * sc.returnMul * (wc ? wc.carbonPriceMul : 1));
  const reqWater = Math.round(strat.waterRequiredUnits * sc.waterDemandMul);
  const availWater = Math.round(
    land.availableWaterUnits * (wc ? wc.waterAvailMul : sc.name === "Water Scarcity" ? MODEL_ASSUMPTIONS.scoring.outcomeAdjustments.waterScarcityAvailabilityMultiplier : 1)
  );

  const riskBase =
    RISK_ORDER.indexOf(strat.irreRisk) * MODEL_ASSUMPTIONS.scoring.outcomeAdjustments.riskLabelIndexMultiplier + (100 - strat.riskSafetyScore) * MODEL_ASSUMPTIONS.scoring.outcomeAdjustments.riskSafetySensitivityMultiplier;
  const riskRaw = Math.round(riskBase + sc.riskDelta + (wc ? wc.riskDelta : 0));

  const feasible = reqWater <= availWater * MODEL_ASSUMPTIONS.scoring.outcomeAdjustments.feasibleAvailabilityMultiplier;

  // Re-score internal scenario dimensions after illustrative stress adjustments.
  const metrics = scoreStrategy(
    carbonT,
    returnL,
    reqWater,
    availWater,
    MODEL_ASSUMPTIONS.scoring.outcomeAdjustments.stressFertilityScenarioInput,
    strat.biodiversity * sc.bioMul,
    riskRaw - MODEL_ASSUMPTIONS.scoring.outcomeAdjustments.riskSafetyOffset,
    land.goal
  );

  const notes = NOTE_BY_CASE[sc.name] ?? NOTE_BY_CASE.Normal;
  const note = feasible
    ? notes[0]
    : `The modeled water requirement (~${reqWater} index units) exceeds the selected availability index (~${availWater}). Review the mix, local water plan and establishment practices.`;

  return {
    scenario: sc,
    name: wc ? "Worst-Case" : sc.name,
    carbonT,
    returnL,
    reqWater,
    availWater,
    riskRaw,
    riskLevel: riskLabelFor(riskRaw),
    resiliencePct: metrics.resilience,
    total: metrics.total,
    feasible,
    note,
  };
}

export { riskLabelFor };
