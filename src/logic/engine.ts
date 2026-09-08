// Canonical GreenVest decision engine.
// It consumes normalized reference coverage and explicit scenario assumptions
// from `src/data/agronomy/`; it does not embed agricultural facts or datasets.

import {
  CATALOG_VALIDATION,
  createLocationProfile,
  MODEL_ASSUMPTIONS,
  RAINFALL_OPTIONS,
  SCENARIO_SPECIES_MODELS,
  SOIL_TYPES,
  STRATEGY_BLUEPRINTS,
  WATER_OPTIONS,
} from "@/data/agronomy";
import type { CanonicalSpeciesModel, DataConfidence, ModelEvidenceStatus, ValidationResult } from "@/data/agronomy";
import type { GoalKey, LandInput, RiskLevel, ScoreMetrics, StrategyResult } from "@/logic/types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 10) / 10;
const scoring = MODEL_ASSUMPTIONS.scoring;

export const RISK_ORDER: RiskLevel[] = ["low", "low-medium", "medium", "medium-high", "high"];

export function validateLandInput(raw: Record<string, unknown>): ValidationResult<LandInput> {
  const issues = [] as ValidationResult<LandInput>["issues"];
  const soil = typeof raw.soil === "string" ? raw.soil.trim() : "";
  const rainfallKey = typeof raw.rainfallKey === "string" ? raw.rainfallKey : "";
  const waterKey = typeof raw.waterKey === "string" ? raw.waterKey : "";
  const goal = typeof raw.goal === "string" ? raw.goal : "";
  const area = Number(raw.area);
  const budgetLakhs = Number(raw.budgetLakhs);
  const location = typeof raw.location === "string" ? raw.location.trim() : "";

  if (!location) issues.push({ path: "location", code: "missing", message: "A location is required for an analysis." });
  if (!Number.isFinite(area) || area < scoring.inputBounds.minimumAreaAcres || area > scoring.inputBounds.maximumAreaAcres) {
    issues.push({ path: "area", code: "invalid-value", message: `Land area must be between ${scoring.inputBounds.minimumAreaAcres} and ${scoring.inputBounds.maximumAreaAcres} acres for the current scenario model.` });
  }
  if (!Number.isFinite(budgetLakhs) || budgetLakhs < scoring.inputBounds.minimumBudgetLakhs || budgetLakhs > scoring.inputBounds.maximumBudgetLakhs) {
    issues.push({ path: "budgetLakhs", code: "invalid-value", message: `Budget must be between ₹${scoring.inputBounds.minimumBudgetLakhs}L and ₹${scoring.inputBounds.maximumBudgetLakhs}L for the current scenario model.` });
  }
  if (!SOIL_TYPES.includes(soil as (typeof SOIL_TYPES)[number])) issues.push({ path: "soil", code: "inconsistent-vocabulary", message: "Selected soil category is not supported by the current screening vocabulary." });
  if (!RAINFALL_OPTIONS.some((item) => item.key === rainfallKey)) issues.push({ path: "rainfallKey", code: "unknown-reference", message: "Selected rainfall scenario is not supported." });
  if (!WATER_OPTIONS.some((item) => item.key === waterKey)) issues.push({ path: "waterKey", code: "unknown-reference", message: "Selected water scenario is not supported." });
  if (goal !== "balanced" && goal !== "carbon" && goal !== "return") issues.push({ path: "goal", code: "unknown-reference", message: "Selected investment goal is not supported." });
  if (issues.length) return { valid: false, issues };

  const rainfall = RAINFALL_OPTIONS.find((item) => item.key === rainfallKey)!;
  const water = WATER_OPTIONS.find((item) => item.key === waterKey)!;
  return {
    valid: true,
    data: {
      location,
      area,
      soil,
      rainfallKey: rainfall.key,
      rainfallLabel: rainfall.label,
      rainfallMm: rainfall.representativeAnnualMm,
      waterKey: water.key,
      waterLabel: water.label,
      availableWaterUnits: water.availabilityIndex,
      budgetLakhs,
      goal: goal as GoalKey,
    },
    issues: [],
  };
}

/** Scenario rainfall screening response (0..1), not an observed local climate measure. */
export function rainSuitability(model: CanonicalSpeciesModel, representativeAnnualMm: number) {
  const [low, high] = model.assumption.rainfallScreeningRangeMm;
  if (representativeAnnualMm >= low && representativeAnnualMm <= high) return 1;
  const gap = representativeAnnualMm < low ? low - representativeAnnualMm : representativeAnnualMm - high;
  return clamp(1 - gap / scoring.rainfallDistanceScaleMm, scoring.rainfallSuitabilityFloor, 1);
}

/** Scenario soil-category screening response (0..1); confirm actual conditions with site testing. */
function soilSuitability(model: CanonicalSpeciesModel, soil: string) {
  return model.assumption.scenarioSoilFit.includes(soil as CanonicalSpeciesModel["assumption"]["scenarioSoilFit"][number])
    ? 1
    : scoring.soilMismatchSuitability;
}

export function speciesSuitability(model: CanonicalSpeciesModel, land: LandInput) {
  return soilSuitability(model, land.soil) * rainSuitability(model, land.rainfallMm);
}

/** Internal relative water index for comparing strategy mixes, not physical water demand. */
export function waterRequiredUnits(share: { id: string; area: number }[]) {
  const sum = share.reduce((total, item) => {
    const model = SCENARIO_SPECIES_MODELS.find((entry) => entry.reference.id === item.id);
    return total + item.area * (model?.assumption.water.indexPerAcre ?? 0);
  }, 0);
  return sum * scoring.waterIndexScale;
}

function confidenceFor(models: CanonicalSpeciesModel[], locationConfidence: DataConfidence): DataConfidence {
  const referenceWeighted = models.reduce((total, model) => {
    if (model.reference.referenceConfidence === "high") return total + scoring.dataConfidence.highReferenceWeight;
    if (model.reference.referenceConfidence === "medium") return total + scoring.dataConfidence.mediumReferenceWeight;
    return total;
  }, 0);
  const speciesConfidence: DataConfidence = referenceWeighted >= models.length * scoring.dataConfidence.highCoverageShare ? "high" : referenceWeighted >= scoring.dataConfidence.mediumReferenceMinimum ? "medium" : "limited";
  if (locationConfidence === "insufficient" || locationConfidence === "limited") return speciesConfidence === "high" ? "medium" : "limited";
  return speciesConfidence;
}

function evidenceStatus(): ModelEvidenceStatus {
  return {
    agronomicSuitability: "reference-based",
    carbon: "scenario-estimate",
    financial: "scenario-estimate",
    water: "scenario-estimate",
    biodiversity: "model-score",
    risk: "model-score",
  };
}

/** Builds the three candidate strategies from normalized reference coverage and scenario assumptions. */
export function buildStrategies(land: LandInput): StrategyResult[] {
  if (!CATALOG_VALIDATION.valid) {
    throw new Error("GreenVest agricultural catalog is invalid. Resolve data validation issues before analysis.");
  }

  return STRATEGY_BLUEPRINTS.map((blueprint) => {
    let carbon = 0;
    let revenue = 0;
    let initCost = 0;
    let maintenance = 0;
    let biodiversity = 0;
    let suitability = 0;
    let waterIndex = 0;
    let riskOffset = 0;
    const models: CanonicalSpeciesModel[] = [];
    const species: StrategyResult["species"] = [];

    for (const part of blueprint.mix) {
      const model = SCENARIO_SPECIES_MODELS.find((entry) => entry.reference.id === part.id);
      if (!model) throw new Error(`Unsupported species in canonical strategy blueprint: ${part.id}`);
      models.push(model);
      const modelSuitability = speciesSuitability(model, land);
      const acres = land.area * part.share;
      const assumption = model.assumption;
      species.push({
        id: model.reference.id,
        name: model.reference.scientificName ? `${model.reference.commonName} (${model.reference.scientificName})` : model.reference.commonName,
        share: part.share,
        category: model.reference.category,
      });

      // Existing prototype arithmetic is retained, but every input is now a
      // named assumption from the canonical model specification.
      carbon += part.share * assumption.carbon.coefficientTco2PerAcre * modelSuitability * assumption.growthMultiplier * assumption.carbon.horizonFactor * acres;
      revenue += part.share * assumption.financial.revenueLakhsPerAcreHorizon * modelSuitability * acres;
      initCost += part.share * assumption.financial.establishmentCostLakhsPerAcre * acres;
      maintenance += part.share * assumption.financial.maintenanceCostLakhsPerAcreYear * acres;
      biodiversity += part.share * assumption.biodiversityHeuristic;
      suitability += part.share * modelSuitability;
      riskOffset += part.share * scoring.riskPenalty[assumption.riskSensitivity];
      waterIndex += part.share * assumption.water.indexPerAcre * acres;
    }

    const modeledWaterRequirement = waterIndex * scoring.waterIndexScale;
    const areaScale = initCost > 0 ? clamp(land.budgetLakhs / Math.max(initCost, 1), scoring.minimumAreaScale, 1) : 1;
    const metrics = scoreStrategy(
      carbon * areaScale,
      revenue * areaScale,
      modeledWaterRequirement,
      land.availableWaterUnits,
      clamp(suitability, 0, 1),
      biodiversity,
      riskOffset + (areaScale < scoring.budgetConstraint.scaleRiskThreshold ? scoring.budgetConstraint.riskAdjustment : 0),
      land.goal
    );

    const locationProfile = createLocationProfile(land.location);
    const dataConfidence = confidenceFor(models, locationProfile.dataConfidence);
    const agronomicFactors = [
      `${locationProfile.note}`,
      `Controlled soil category: ${land.soil}; detailed depth, pH, salinity and drainage are not provided.`,
      `Rainfall uses ${land.rainfallLabel.toLowerCase()} as a representative scenario input.`,
    ];

    return {
      id: blueprint.id,
      code: blueprint.code,
      key: blueprint.key,
      name: blueprint.name,
      tagline: blueprint.tagline,
      species,
      initCostL: round(initCost),
      maintCostLyr: round(maintenance),
      carbonBudgetT: Math.round(carbon * areaScale),
      scenarioCarbonEstimatePerAcre: round(carbon / Math.max(land.area, 1)),
      returnL: Math.round(revenue * areaScale),
      returnShort: `₹${Math.round(revenue * areaScale)}L`,
      revenueL: Math.round(revenue * areaScale),
      waterRequiredUnits: round(modeledWaterRequirement),
      biodiversity: Math.round(clamp(biodiversity)),
      irreRisk: riskLabelFor(riskOffset + (areaScale < scoring.budgetConstraint.scaleRiskThreshold ? scoring.budgetConstraint.riskAdjustment : 0)),
      riskSafetyScore: metrics.risk,
      rationale: "",
      metrics,
      evidenceStatus: evidenceStatus(),
      dataConfidence,
      trace: {
        agronomicFactors,
        waterFactors: [`Modeled water requirement: ${Math.round(modeledWaterRequirement)} internal index units.`, `Selected water scenario: ${land.waterLabel} (${land.availableWaterUnits} internal availability index units).`],
        financialFactors: [`Initial investment assumption: ₹${round(initCost)}L.`, `Maintenance assumption: ₹${round(maintenance)}L per acre-year.`, `Scenario financial horizon: ${MODEL_ASSUMPTIONS.metadata.horizonYears} years.`],
        scenarioFactors: ["Carbon, finance, water, biodiversity, resilience and risk use canonical scenario assumptions.", "Outputs are for relative comparison and require local validation."],
        dataConfidence,
      },
      carbonScenario: {
        evidenceStatus: "scenario-estimate",
        unit: "tCO2",
        horizonYears: MODEL_ASSUMPTIONS.metadata.horizonYears,
        methodology: "Internal carbon coefficient × modeled area × screening response × growth multiplier × horizon factor.",
        output: Math.round(carbon * areaScale),
      },
      financialScenario: {
        evidenceStatus: "scenario-estimate",
        unit: "INR-lakhs",
        horizonYears: MODEL_ASSUMPTIONS.metadata.horizonYears,
        grossRevenueAssumption: round(revenue),
        establishmentCostAssumption: round(initCost),
        maintenanceCostAssumptionPerYear: round(maintenance),
        budgetFeasibilityScale: round(areaScale),
        output: Math.round(revenue * areaScale),
        note: "Legacy scenario-finance proxy. Establishment cost constrains the modeled scale; maintenance is separately disclosed and not a local quotation.",
      },
      waterScenario: {
        evidenceStatus: "scenario-estimate",
        unit: "internal-relative-index",
        requirement: round(modeledWaterRequirement),
        availability: land.availableWaterUnits,
        note: "Relative model index only; not irrigation volume or water-rights assessment.",
      },
      biodiversityScenario: {
        evidenceStatus: "model-score",
        score: metrics.biodiversity,
        note: "Heuristic based on the scenario species mix; not a field biodiversity survey.",
      },
      riskScenario: {
        evidenceStatus: "model-score",
        sensitivityScore: Math.round(100 - metrics.risk),
        safetyScore: metrics.risk,
        category: riskLabelFor(riskOffset + (areaScale < scoring.budgetConstraint.scaleRiskThreshold ? scoring.budgetConstraint.riskAdjustment : 0)),
        note: "Model sensitivity across scenario water, climate and financial assumptions; not a failure probability.",
      },
      recommended: false,
    };
  });
}

export function riskLabelFor(raw: number): RiskLevel {
  if (raw < scoring.riskLabelThresholds.low) return "low";
  if (raw < scoring.riskLabelThresholds.lowMedium) return "low-medium";
  if (raw < scoring.riskLabelThresholds.medium) return "medium";
  if (raw < scoring.riskLabelThresholds.mediumHigh) return "medium-high";
  return "high";
}

/** Weighted scenario score from internal model signals given the selected goal. */
export function scoreStrategy(
  carbonBudgetT: number,
  returnL: number,
  reqWater: number,
  availWater: number,
  fertility: number,
  biodiversity: number,
  riskRaw: number,
  goal: GoalKey
): ScoreMetrics {
  const carbon = clamp(carbonBudgetT / scoring.carbonScore.normalization * 100, scoring.carbonScore.minimum, scoring.carbonScore.maximum) * scoring.carbonScore.multiplier + scoring.carbonScore.offset;
  const financial = clamp(returnL / scoring.financialScore.normalization * 100, scoring.financialScore.minimum, scoring.financialScore.maximum);
  const ratio = reqWater > 0 ? availWater / reqWater : 2;
  const water = clamp(
    ratio < 1
      ? ratio * scoring.waterScore.shortfallMultiplier
      : scoring.waterScore.baseAtFeasible + Math.min(ratio - 1, scoring.waterScore.headroomCap) * scoring.waterScore.headroomMultiplier,
    scoring.waterScore.minimum,
    scoring.waterScore.maximum
  );
  const resilience = clamp(
    scoring.resilience.base + (fertility - scoring.resilience.fertilityBaseline) * scoring.resilience.fertilityMultiplier + ratioMore(ratio) - water * scoring.resilience.waterPenalty,
    scoring.resilience.minimum,
    scoring.resilience.maximum
  );
  const bio = clamp(biodiversity * scoring.biodiversityScore.multiplier, scoring.biodiversityScore.minimum, scoring.biodiversityScore.maximum);
  const risk = clamp(100 - riskRaw, scoring.risk.minimum, scoring.risk.maximum);
  const weights = weightsFor(goal);
  const total = clamp(
    carbon * weights.carbon + financial * weights.financial + water * weights.water + resilience * weights.resilience + bio * weights.bio + risk * weights.risk,
    0,
    100
  );

  return {
    carbon: Math.round(clamp(carbon)),
    financial: Math.round(clamp(financial)),
    water: Math.round(clamp(water)),
    resilience: Math.round(clamp(resilience)),
    biodiversity: Math.round(clamp(bio)),
    risk: Math.round(clamp(risk)),
    total: Math.round(total),
  };
}

function ratioMore(ratio: number) {
  return Math.max(0, Math.min((ratio - 1) * scoring.resilience.headroomMultiplier, scoring.resilience.headroomMultiplier));
}

export function weightsFor(goal: GoalKey) {
  return scoring.goalWeights[goal] ?? scoring.goalWeights.balanced;
}

export function dimensionRows(metrics: ScoreMetrics) {
  return [
    { label: "Scenario Carbon Score", value: metrics.carbon },
    { label: "Scenario Financial Score", value: metrics.financial },
    { label: "Modeled Water Fit", value: metrics.water },
    { label: "Modeled Resilience", value: metrics.resilience },
    { label: "Modeled Biodiversity", value: metrics.biodiversity },
    { label: "Risk-Sensitivity Safety", value: metrics.risk },
  ];
}