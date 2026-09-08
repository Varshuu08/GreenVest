/** Data contracts that keep agricultural references, model assumptions and engine outputs separate. */

export type EvidenceType = "government" | "research" | "agricultural_reference" | "unresolved";
export type EvidenceConfidence = "high" | "medium" | "limited";
export type EvidenceStatus = "reference-based" | "scenario-estimate" | "model-score" | "insufficient-data";
export type DataConfidence = "high" | "medium" | "limited" | "insufficient";
export type SoilCategory = "Sandy Loam" | "Clay" | "Silty" | "Laterite" | "Alluvial" | "Black Cotton";
export type RainfallScenarioKey = "low" | "moderate" | "high";
export type WaterScenarioKey = "limited" | "seasonal" | "adequate" | "abundant";
export type GoalKey = "balanced" | "carbon" | "return";
export type RiskLevel = "low" | "low-medium" | "medium" | "medium-high" | "high";

export interface AgriculturalSource {
  organisation: string;
  title: string;
  sourceUrl: string;
  region: string;
  evidenceType: EvidenceType;
  confidence: EvidenceConfidence;
  accessedFor: string;
}

export interface AgriculturalReferenceFact {
  id: string;
  speciesId: string;
  topic: "soil-drainage" | "rainfall-climate" | "water-management" | "species-selection";
  fact: string;
  implication: string;
  source: AgriculturalSource;
  evidenceStatus: "reference-based" | "requires-local-validation";
}

export interface SoilProfile {
  id: SoilCategory;
  label: SoilCategory;
  evidenceStatus: EvidenceStatus;
  note: string;
}

export interface RainfallScenarioProfile {
  key: RainfallScenarioKey;
  label: string;
  representativeAnnualMm: number;
  evidenceStatus: "scenario-estimate";
  note: string;
}

export interface WaterProfile {
  key: WaterScenarioKey;
  label: string;
  availabilityIndex: number;
  unit: "internal-relative-index";
  evidenceStatus: "scenario-estimate";
  note: string;
}

export interface LocationProfile {
  userEnteredLocation: string;
  referenceLocationStatus: "not-linked" | "linked";
  climateDataStatus: "not-linked" | "linked";
  dataConfidence: "limited" | "medium" | "high" | "insufficient";
  note: string;
}

export interface CarbonAssumption {
  coefficientTco2PerAcre: number;
  horizonYears: number;
  horizonFactor: number;
  unit: "tCO2-per-acre-over-modeled-horizon";
  evidenceStatus: "scenario-estimate";
}

export interface FinancialAssumption {
  establishmentCostLakhsPerAcre: number;
  maintenanceCostLakhsPerAcreYear: number;
  revenueLakhsPerAcreHorizon: number;
  revenueFactor: number;
  horizonYears: number;
  unit: "INR-lakhs";
  evidenceStatus: "scenario-estimate";
}

export interface WaterAssumption {
  indexPerAcre: number;
  unit: "internal-relative-index";
  evidenceStatus: "scenario-estimate";
}

export interface SpeciesScenarioAssumption {
  speciesId: string;
  scenarioSoilFit: SoilCategory[];
  rainfallScreeningRangeMm: [number, number];
  carbon: CarbonAssumption;
  financial: FinancialAssumption;
  water: WaterAssumption;
  growthMultiplier: number;
  riskSensitivity: RiskLevel;
  biodiversityHeuristic: number;
  evidenceStatus: "scenario-estimate";
  note: string;
}

export interface AgriculturalSpecies {
  id: string;
  commonName: string;
  scientificName?: string;
  category: "carbon" | "timber" | "fruit" | "agro";
  accent: "forest" | "emerald" | "mint" | "amber" | "sky";
  referenceFacts: string[];
  referenceConfidence: DataConfidence;
  referenceStatus: EvidenceStatus;
}

export interface CanonicalSpeciesModel {
  reference: AgriculturalSpecies;
  assumption: SpeciesScenarioAssumption;
}

export interface StrategyBlueprint {
  id: string;
  code: "A" | "B" | "C";
  key: GoalKey;
  name: string;
  tagline: string;
  mix: { id: string; share: number }[];
}

export interface ScenarioScoringAssumptions {
  soilMismatchSuitability: number;
  rainfallSuitabilityFloor: number;
  rainfallDistanceScaleMm: number;
  waterIndexScale: number;
  carbonHorizonFactor: number;
  minimumAreaScale: number;
  budgetConstraint: { scaleRiskThreshold: number; riskAdjustment: number };
  carbonScore: { normalization: number; multiplier: number; offset: number; minimum: number; maximum: number };
  financialScore: { normalization: number; minimum: number; maximum: number };
  waterScore: {
    baseAtFeasible: number;
    shortfallMultiplier: number;
    headroomCap: number;
    headroomMultiplier: number;
    minimum: number;
    maximum: number;
  };
  resilience: {
    base: number;
    fertilityBaseline: number;
    fertilityMultiplier: number;
    waterPenalty: number;
    headroomMultiplier: number;
    minimum: number;
    maximum: number;
  };
  biodiversityScore: { multiplier: number; minimum: number; maximum: number };
  risk: { minimum: number; maximum: number };
  riskLabelThresholds: { low: number; lowMedium: number; medium: number; mediumHigh: number };
  dataConfidence: { highReferenceWeight: number; mediumReferenceWeight: number; highCoverageShare: number; mediumReferenceMinimum: number };
  inputBounds: { minimumAreaAcres: number; maximumAreaAcres: number; minimumBudgetLakhs: number; maximumBudgetLakhs: number };
  outcomeAdjustments: {
    waterScarcityAvailabilityMultiplier: number;
    feasibleAvailabilityMultiplier: number;
    riskLabelIndexMultiplier: number;
    riskSafetyOffset: number;
    riskSafetySensitivityMultiplier: number;
    stressFertilityScenarioInput: number;
  };
  recommendation: {
    strongCarbonScore: number;
    financialAlignmentScore: number;
    lowWaterFitScore: number;
    returnFocusWaterFitScore: number;
    waterConstraintMultiplier: number;
    worstCaseViabilityScore: number;
    worstCaseSafetyScore: number;
  };
  goalWeights: Record<GoalKey, { carbon: number; financial: number; water: number; resilience: number; bio: number; risk: number }>;
  riskPenalty: Record<RiskLevel, number>;
}

export interface ZoningScenarioAssumptions {
  carbonCoefficientTco2PerAcre: number;
  incomeFinancialCoefficientLakhsPerAcre: number;
  carbonFinancialCoefficientLakhsPerAcre: number;
  biodiversityFinancialCoefficientLakhsPerAcre: number;
  incomeWaterIndexPerAcre: number;
  carbonWaterIndexPerAcre: number;
  biodiversityWaterIndexPerAcre: number;
  waterAdjustment: number;
  biodiversityCarbonContributionMultiplier: number;
  biodiversity: { biodiversityZone: number; carbonZone: number; conservationZone: number; incomeZone: number };
  risk: { base: number; incomeAllocationSensitivity: number; lowSeverityBaseline: number; severityThreshold: number };
  fertilityScenarioInput: number;
  fallbackFertilityScenarioInput: number;
  feasibleAvailabilityMultiplier: number;
  defaultAllocation: { carbon: number; income: number; biodiversity: number; conservation: number };
}

export interface SimulatorScenarioAssumptions {
  baselineBudgetLakhs: number;
  baselineCarbonPrice: number;
  carbonBaselineAdjustment: number;
  financialWaterBase: number;
  financialWaterScale: number;
  waterRequirementReductionScale: number;
  prioritySpreadScale: number;
  riskWaterSensitivity: number;
  minimumCarbonEstimate: number;
  minimumFinancialEstimate: number;
}

export interface StressScenarioAssumption {
  name: string;
  icon: string;
  rainMul: number;
  carbonMul: number;
  returnMul: number;
  riskDelta: number;
  waterDemandMul: number;
  bioMul: number;
  severity: number;
  evidenceStatus: "scenario-estimate";
  note: string;
}

export interface ValidationIssue {
  path: string;
  code: "missing" | "duplicate" | "invalid-unit" | "invalid-value" | "unknown-reference" | "inconsistent-vocabulary";
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  issues: ValidationIssue[];
}

export interface ModelEvidenceStatus {
  agronomicSuitability: EvidenceStatus;
  carbon: EvidenceStatus;
  financial: EvidenceStatus;
  water: EvidenceStatus;
  biodiversity: EvidenceStatus;
  risk: EvidenceStatus;
}

export interface RecommendationTrace {
  agronomicFactors: string[];
  waterFactors: string[];
  financialFactors: string[];
  scenarioFactors: string[];
  dataConfidence: DataConfidence;
}