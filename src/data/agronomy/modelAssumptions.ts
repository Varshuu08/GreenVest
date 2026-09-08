import rawSpec from "../../../shared/greenvest-model-spec.json";
import type {
  CarbonAssumption,
  FinancialAssumption,
  RiskLevel,
  SpeciesScenarioAssumption,
  StressScenarioAssumption,
  StrategyBlueprint,
  SimulatorScenarioAssumptions,
  ScenarioScoringAssumptions,
  SoilCategory,
  RainfallScenarioKey,
  WaterScenarioKey,
  ZoningScenarioAssumptions,
} from "@/data/agronomy/contracts";

type RawSpeciesAssumption = {
  speciesId: string;
  scenarioSoilFit: string[];
  rainfallScreeningRangeMm: number[];
  waterIndexPerAcre: number;
  carbonCoefficientTco2PerAcre: number;
  growthMultiplier: number;
  financial: {
    establishmentCostLakhsPerAcre: number;
    maintenanceCostLakhsPerAcreYear: number;
    revenueLakhsPerAcreHorizon: number;
    revenueFactor: number;
  };
  riskSensitivity: string;
  biodiversityHeuristic: number;
};

const raw = rawSpec as unknown as {
  metadata: { id: string; kind: string; horizonYears: number; description: string };
  controlledVocabulary: {
    soils: string[];
    rainfallScenarios: { label: string; key: string; representativeAnnualMm: number }[];
    waterAvailabilityScenarios: { label: string; key: string; availabilityIndex: number }[];
  };
  scoring: ScenarioScoringAssumptions;
  speciesScenarioAssumptions: RawSpeciesAssumption[];
  strategyBlueprints: StrategyBlueprint[];
  zoningScenarioAssumptions: ZoningScenarioAssumptions;
  simulatorScenarioAssumptions: SimulatorScenarioAssumptions;
  stressScenarioAssumptions: Omit<StressScenarioAssumption, "evidenceStatus" | "note">[];
  worstCaseStressAssumption: {
    label: string;
    rainMul: number;
    waterAvailMul: number;
    carbonPriceMul: number;
    maintHike: number;
    riskDelta: number;
  };
};

export const CANONICAL_MODEL_SPEC = {
  ...raw,
  controlledVocabulary: {
    soils: raw.controlledVocabulary.soils as SoilCategory[],
    rainfallScenarios: raw.controlledVocabulary.rainfallScenarios.map((scenario) => ({
      ...scenario,
      key: scenario.key as RainfallScenarioKey,
    })),
    waterAvailabilityScenarios: raw.controlledVocabulary.waterAvailabilityScenarios.map((scenario) => ({
      ...scenario,
      key: scenario.key as WaterScenarioKey,
    })),
  },
};

const horizonYears = CANONICAL_MODEL_SPEC.metadata.horizonYears;

export const SPECIES_SCENARIO_ASSUMPTIONS: SpeciesScenarioAssumption[] = raw.speciesScenarioAssumptions.map((assumption) => {
  const carbon: CarbonAssumption = {
    coefficientTco2PerAcre: assumption.carbonCoefficientTco2PerAcre,
    horizonYears,
    horizonFactor: raw.scoring.carbonHorizonFactor,
    unit: "tCO2-per-acre-over-modeled-horizon",
    evidenceStatus: "scenario-estimate",
  };
  const financial: FinancialAssumption = {
    ...assumption.financial,
    horizonYears,
    unit: "INR-lakhs",
    evidenceStatus: "scenario-estimate",
  };
  return {
    speciesId: assumption.speciesId,
    scenarioSoilFit: assumption.scenarioSoilFit as SoilCategory[],
    rainfallScreeningRangeMm: [assumption.rainfallScreeningRangeMm[0], assumption.rainfallScreeningRangeMm[1]],
    carbon,
    financial,
    water: {
      indexPerAcre: assumption.waterIndexPerAcre,
      unit: "internal-relative-index",
      evidenceStatus: "scenario-estimate",
    },
    growthMultiplier: assumption.growthMultiplier,
    riskSensitivity: assumption.riskSensitivity as RiskLevel,
    biodiversityHeuristic: assumption.biodiversityHeuristic,
    evidenceStatus: "scenario-estimate",
    note: "Internal scenario-model assumptions retained from the pre-dataset GreenVest prototype. Validate or replace through an evidence-backed methodology before production use.",
  };
});

export const STRATEGY_BLUEPRINTS = raw.strategyBlueprints;

export const MODEL_ASSUMPTIONS = {
  metadata: CANONICAL_MODEL_SPEC.metadata,
  scoring: raw.scoring,
  zoning: raw.zoningScenarioAssumptions,
  simulator: raw.simulatorScenarioAssumptions,
  waterIndexScale: raw.scoring.waterIndexScale,
  carbonHorizonFactor: raw.scoring.carbonHorizonFactor,
} as const;

export const SCENARIO_MODEL_METADATA = {
  horizon: `${horizonYears}-year modeled scenario`,
  carbon: "Unit: tCO2 over the modeled horizon. Internal coefficient multiplied by modelled area, suitability and growth adjustments; not field-measured sequestration or carbon-credit eligibility.",
  finance: "Unit: INR lakhs over the modeled horizon. Internal establishment, maintenance and revenue assumptions; not market quotes, cash-flow forecasts or investment advice.",
  water: "Unit: internal relative index. Not litres, cubic metres, pump capacity or an irrigation prescription.",
  rainfall: "Rainfall categories use representative annual scenario inputs for relative screening. They are not measured rainfall for Coimbatore or any parcel.",
  biodiversity: "Heuristic score based on the modeled species mix; not a field biodiversity survey.",
  risk: "Sensitivity heuristic combining modeled water, climate and financial factors; not a probability of failure.",
} as const;

export const PLANTATION_CAVEAT =
  "Agronomic suitability is reference-based screening guidance; carbon, financial, water, biodiversity, resilience and risk outputs are scenario estimates, not measured or guaranteed outcomes.";

export const STRESS_SCENARIO_ASSUMPTIONS: StressScenarioAssumption[] = raw.stressScenarioAssumptions.map((scenario) => ({
  ...scenario,
  evidenceStatus: "scenario-estimate",
  note: "Illustrative stress multiplier used for comparison. Not observed climate data, probability or forecast.",
}));

export const WORST_CASE_STRESS_ASSUMPTION = {
  ...raw.worstCaseStressAssumption,
  evidenceStatus: "scenario-estimate" as const,
  note: "Illustrative combined stress assumption. Not a climate, price or operating-cost forecast.",
};

export const MODEL_ASSUMPTION_SUMMARY =
  "Carbon, financial, maintenance, water-index, biodiversity, resilience and risk values are GreenVest scenario-model outputs. They are not field measurements, irrigation volumes, carbon-credit estimates or guaranteed outcomes.";