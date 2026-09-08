import type { LandInput, ZoningAllocation, ScoreMetrics } from "@/logic/types";
import { scoreStrategy } from "@/logic/engine";
import { CLIMATE_SCENARIOS } from "@/logic/scenarios";
import { MODEL_ASSUMPTIONS } from "@/data/agronomy";

const zoningAssumptions = MODEL_ASSUMPTIONS.zoning;

/** Derives relative zoning scenario metrics; validate any field plan independently. */
export function evaluateZoning(
  z: ZoningAllocation,
  land: LandInput,
  scenarioName = "Normal"
) {
  const sc = CLIMATE_SCENARIOS.find((s) => s.name === scenarioName) ?? CLIMATE_SCENARIOS[0];
  const area = land.area;
  const cropShare = Math.max(0.001, area);
  const carbonAcres = (z.carbon / 100) * cropShare;
  const incomeAcres = (z.income / 100) * cropShare;
  const bioAcres = (z.biodiversity / 100) * cropShare;

  const carbonBudget =
    carbonAcres * zoningAssumptions.carbonCoefficientTco2PerAcre * sc.carbonMul +
    bioAcres * zoningAssumptions.carbonCoefficientTco2PerAcre * zoningAssumptions.biodiversityCarbonContributionMultiplier * sc.carbonMul;

  const returnL =
    incomeAcres * zoningAssumptions.incomeFinancialCoefficientLakhsPerAcre * sc.returnMul +
    carbonAcres * zoningAssumptions.carbonFinancialCoefficientLakhsPerAcre * sc.returnMul +
    bioAcres * zoningAssumptions.biodiversityFinancialCoefficientLakhsPerAcre;

  const reqWater =
    incomeAcres * zoningAssumptions.incomeWaterIndexPerAcre * sc.waterDemandMul +
    carbonAcres * zoningAssumptions.carbonWaterIndexPerAcre * sc.waterDemandMul +
    bioAcres * zoningAssumptions.biodiversityWaterIndexPerAcre;
  const biodiversity =
    (bioAcres / area) * zoningAssumptions.biodiversity.biodiversityZone +
    (z.carbon / 100) * zoningAssumptions.biodiversity.carbonZone +
    (z.conservation / 100) * zoningAssumptions.biodiversity.conservationZone +
    (incomeAcres / area) * zoningAssumptions.biodiversity.incomeZone;
  const riskRaw =
    zoningAssumptions.risk.base +
    (incomeAcres / area) * zoningAssumptions.risk.incomeAllocationSensitivity +
    (sc.severity > zoningAssumptions.risk.severityThreshold ? sc.riskDelta : zoningAssumptions.risk.lowSeverityBaseline);

  const metrics = scoreStrategy(
    carbonBudget,
    returnL,
    reqWater,
    land.availableWaterUnits,
    cropShare > 0 ? zoningAssumptions.fertilityScenarioInput : zoningAssumptions.fallbackFertilityScenarioInput,
    biodiversity,
    riskRaw,
    land.goal
  );
  return {
    carbonBudget: Math.round(carbonBudget),
    returnL: Math.round(returnL),
    reqWater: Math.round(reqWater * zoningAssumptions.waterAdjustment),
    availWater: land.availableWaterUnits,
    biodiversity: Math.round(biodiversity),
    feasible: reqWater * zoningAssumptions.waterAdjustment <= land.availableWaterUnits * zoningAssumptions.feasibleAvailabilityMultiplier,
    metrics,
  };
}

export const defaultZoning: ZoningAllocation = {
  carbon: zoningAssumptions.defaultAllocation.carbon,
  income: zoningAssumptions.defaultAllocation.income,
  biodiversity: zoningAssumptions.defaultAllocation.biodiversity,
  conservation: zoningAssumptions.defaultAllocation.conservation,
};

/** Hint about the biggest lever based on what moved. */
export function zoneTradeoff(z: ZoningAllocation) {
  if (z.carbon > 60 || z.income > 40)
    return {
      tone: "warn" as const,
      title: z.carbon > 60 ? "Carbon-heavy split" : "Income-heavy split",
      text:
        z.carbon > 60
          ? "A carbon-heavy split raises the Scenario Carbon Estimate and the modeled biodiversity score, while lowering the model's near-term financial outcome."
          : "An income-heavy split raises the Scenario Financial Estimate and model sensitivity together; review water fit and market assumptions.",
    };
  if (z.biodiversity >= 25)
    return {
      tone: "pass" as const,
      title: "Conservation-positive",
      text: "A larger biodiversity zone raises the model's biodiversity and resilience heuristics; field outcomes depend on native species, habitat and management.",
    };
  return {
    tone: "pass" as const,
    title: "Balanced parcel",
    text: "This split keeps usable income without pushing a single dimension to an extreme.",
  };
}

export type { ScoreMetrics };
