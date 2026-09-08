// Canonical backend adapter for the GreenVest scenario engine.
// It reads `shared/greenvest-model-spec.json`, the same assumption source
// used by the frontend. This avoids a second, divergent coefficient set.

import { MODEL_SPEC } from "./modelSpec.js";

const clamp = (value, low = 0, high = 100) => Math.max(low, Math.min(high, value));
const round = (value) => Math.round(value * 10) / 10;
const byId = new Map(MODEL_SPEC.speciesScenarioAssumptions.map((item) => [item.speciesId, item]));
const scoring = MODEL_SPEC.scoring;

function budgetLakhsFrom(input) {
  const rawBudget = Number(input.budgetLakhs ?? input.budget);
  if (!Number.isFinite(rawBudget)) return NaN;
  return rawBudget > 1000 ? rawBudget / 100000 : rawBudget;
}

/** Validates API input against the same canonical vocabularies as the browser engine. */
export function validateAnalysisInput(input = {}) {
  const issues = [];
  const area = Number(input.landArea ?? input.area);
  const budgetLakhs = budgetLakhsFrom(input);
  const rainfallKey = input.rainfallKey || input.rainfall;
  const waterKey = input.waterKey || input.waterAvailability;

  if (typeof input.location !== "string" || !input.location.trim()) issues.push("location is required");
  if (!Number.isFinite(area) || area < scoring.inputBounds.minimumAreaAcres || area > scoring.inputBounds.maximumAreaAcres) {
    issues.push(`land area must be between ${scoring.inputBounds.minimumAreaAcres} and ${scoring.inputBounds.maximumAreaAcres} acres`);
  }
  if (!MODEL_SPEC.controlledVocabulary.soils.includes(input.soil)) issues.push("soil is not in the supported GreenVest vocabulary");
  if (!MODEL_SPEC.controlledVocabulary.rainfallScenarios.some((item) => item.key === rainfallKey)) issues.push("rainfall scenario is not supported");
  if (!MODEL_SPEC.controlledVocabulary.waterAvailabilityScenarios.some((item) => item.key === waterKey)) issues.push("water scenario is not supported");
  if (!["balanced", "carbon", "return"].includes(input.goal)) issues.push("investment goal is not supported");
  if (!Number.isFinite(budgetLakhs) || budgetLakhs < scoring.inputBounds.minimumBudgetLakhs || budgetLakhs > scoring.inputBounds.maximumBudgetLakhs) {
    issues.push(`budget must be between ₹${scoring.inputBounds.minimumBudgetLakhs}L and ₹${scoring.inputBounds.maximumBudgetLakhs}L`);
  }
  return { valid: issues.length === 0, issues };
}

function normaliseLand(input = {}) {
  const rainfallKey = input.rainfallKey || input.rainfall || "moderate";
  const waterKey = input.waterKey || input.waterAvailability || "limited";
  const rainfall = MODEL_SPEC.controlledVocabulary.rainfallScenarios.find((item) => item.key === rainfallKey) || MODEL_SPEC.controlledVocabulary.rainfallScenarios[1];
  const water = MODEL_SPEC.controlledVocabulary.waterAvailabilityScenarios.find((item) => item.key === waterKey) || MODEL_SPEC.controlledVocabulary.waterAvailabilityScenarios[0];
  const budgetLakhs = budgetLakhsFrom(input);
  const soil = MODEL_SPEC.controlledVocabulary.soils.includes(input.soil) ? input.soil : MODEL_SPEC.controlledVocabulary.soils[0];
  const goal = ["balanced", "carbon", "return"].includes(input.goal) ? input.goal : "balanced";

  return {
    location: String(input.location || "Coimbatore, Tamil Nadu"),
    area: clamp(Number(input.landArea ?? input.area) || 25, scoring.inputBounds.minimumAreaAcres, scoring.inputBounds.maximumAreaAcres),
    soil,
    rainfall,
    water,
    budgetLakhs: clamp(budgetLakhs, scoring.inputBounds.minimumBudgetLakhs, scoring.inputBounds.maximumBudgetLakhs),
    goal,
  };
}

function scenarioSuitability(assumption, land) {
  const soilFit = assumption.scenarioSoilFit.includes(land.soil) ? 1 : scoring.soilMismatchSuitability;
  const [low, high] = assumption.rainfallScreeningRangeMm;
  const rain = land.rainfall.representativeAnnualMm;
  const gap = rain < low ? low - rain : rain > high ? rain - high : 0;
  const rainFit = gap === 0 ? 1 : clamp(1 - gap / scoring.rainfallDistanceScaleMm, scoring.rainfallSuitabilityFloor, 1);
  return soilFit * rainFit;
}

function scoreScenario(carbonEstimate, financialEstimate, waterIndex, availabilityIndex, suitability, biodiversity, riskRaw, goal) {
  const carbon = clamp(carbonEstimate / scoring.carbonScore.normalization * 100, scoring.carbonScore.minimum, scoring.carbonScore.maximum) * scoring.carbonScore.multiplier + scoring.carbonScore.offset;
  const financial = clamp(financialEstimate / scoring.financialScore.normalization * 100, scoring.financialScore.minimum, scoring.financialScore.maximum);
  const ratio = waterIndex > 0 ? availabilityIndex / waterIndex : 2;
  const water = clamp(
    ratio < 1
      ? ratio * scoring.waterScore.shortfallMultiplier
      : scoring.waterScore.baseAtFeasible + Math.min(ratio - 1, scoring.waterScore.headroomCap) * scoring.waterScore.headroomMultiplier,
    scoring.waterScore.minimum,
    scoring.waterScore.maximum
  );
  const headroom = Math.max(0, Math.min((ratio - 1) * scoring.resilience.headroomMultiplier, scoring.resilience.headroomMultiplier));
  const resilience = clamp(
    scoring.resilience.base + (suitability - scoring.resilience.fertilityBaseline) * scoring.resilience.fertilityMultiplier + headroom - water * scoring.resilience.waterPenalty,
    scoring.resilience.minimum,
    scoring.resilience.maximum
  );
  const biodiversityScore = clamp(biodiversity * scoring.biodiversityScore.multiplier, scoring.biodiversityScore.minimum, scoring.biodiversityScore.maximum);
  const risk = clamp(100 - riskRaw, scoring.risk.minimum, scoring.risk.maximum);
  const weights = scoring.goalWeights[goal] || scoring.goalWeights.balanced;
  const total = clamp(carbon * weights.carbon + financial * weights.financial + water * weights.water + resilience * weights.resilience + biodiversityScore * weights.bio + risk * weights.risk, 0, 100);
  return { carbon: Math.round(carbon), financial: Math.round(financial), water: Math.round(water), resilience: Math.round(resilience), biodiversity: Math.round(biodiversityScore), risk: Math.round(risk), total: Math.round(total) };
}

function riskLabel(raw) {
  if (raw < scoring.riskLabelThresholds.low) return "low";
  if (raw < scoring.riskLabelThresholds.lowMedium) return "low-medium";
  if (raw < scoring.riskLabelThresholds.medium) return "medium";
  if (raw < scoring.riskLabelThresholds.mediumHigh) return "medium-high";
  return "high";
}

/**
 * Exact assumption-driven mirror of `src/logic/engine.ts` for API use.
 * Results remain scenario estimates and must not be interpreted as evidence.
 */
export function evaluateLand(input) {
  const land = normaliseLand(input);
  const strategies = MODEL_SPEC.strategyBlueprints.map((blueprint) => {
    let carbon = 0;
    let financial = 0;
    let establishment = 0;
    let maintenance = 0;
    let biodiversity = 0;
    let suitability = 0;
    let water = 0;
    let riskOffset = 0;

    blueprint.mix.forEach((part) => {
      const assumption = byId.get(part.id);
      if (!assumption) throw new Error(`Unknown canonical species: ${part.id}`);
      const fit = scenarioSuitability(assumption, land);
      const acres = land.area * part.share;
      carbon += part.share * assumption.carbonCoefficientTco2PerAcre * fit * assumption.growthMultiplier * scoring.carbonHorizonFactor * acres;
      financial += part.share * assumption.financial.revenueLakhsPerAcreHorizon * fit * acres;
      establishment += part.share * assumption.financial.establishmentCostLakhsPerAcre * acres;
      maintenance += part.share * assumption.financial.maintenanceCostLakhsPerAcreYear * acres;
      biodiversity += part.share * assumption.biodiversityHeuristic;
      suitability += part.share * fit;
      water += part.share * assumption.waterIndexPerAcre * acres;
      riskOffset += part.share * scoring.riskPenalty[assumption.riskSensitivity];
    });

    const waterRequirement = water * scoring.waterIndexScale;
    const areaScale = establishment > 0 ? clamp(land.budgetLakhs / Math.max(establishment, 1), scoring.minimumAreaScale, 1) : 1;
    const budgetRiskAdjustment = areaScale < scoring.budgetConstraint.scaleRiskThreshold ? scoring.budgetConstraint.riskAdjustment : 0;
    const metrics = scoreScenario(carbon * areaScale, financial * areaScale, waterRequirement, land.water.availabilityIndex, clamp(suitability, 0, 1), biodiversity, riskOffset + budgetRiskAdjustment, land.goal);
    const riskRaw = riskOffset + budgetRiskAdjustment;

    return {
      code: blueprint.code,
      name: blueprint.name,
      description: blueprint.tagline,
      investment: round(establishment),
      maintenanceAssumption: round(maintenance),
      carbonEstimate: Math.round(carbon * areaScale),
      financialEstimate: Math.round(financial * areaScale),
      waterRequirement: round(waterRequirement),
      risk: riskLabel(riskRaw),
      riskSensitivityScore: 100 - metrics.risk,
      resilience: metrics.resilience,
      biodiversity: metrics.biodiversity,
      greenvestScore: metrics.total,
      evidenceStatus: {
        agronomicSuitability: "reference-based",
        carbon: "scenario-estimate",
        financial: "scenario-estimate",
        water: "scenario-estimate",
        biodiversity: "model-score",
        risk: "model-score",
      },
    };
  });

  const recommendedStrategy = [...strategies].sort((a, b) => b.greenvestScore - a.greenvestScore)[0];
  return {
    modelVersion: MODEL_SPEC.metadata.id,
    modelHorizonYears: MODEL_SPEC.metadata.horizonYears,
    analysis: {
      location: land.location,
      landSuitability: "reference-screened",
      area: land.area,
      rainfallScenario: land.rainfall.label,
      waterScenario: land.water.label,
      budgetScenarioLakhs: land.budgetLakhs,
    },
    strategies,
    recommendedStrategy,
    greenvestScore: recommendedStrategy.greenvestScore,
    carbonEstimate: recommendedStrategy.carbonEstimate,
    financialEstimate: recommendedStrategy.financialEstimate,
    returnEstimate: recommendedStrategy.financialEstimate,
  };
}

export const simulator = (base, overrides) => ({ ...base, ...overrides, modelVersion: MODEL_SPEC.metadata.id, note: "illustrative scenario" });