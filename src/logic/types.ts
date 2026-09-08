// Engine output contracts. Reference data and model assumptions are defined
// separately in `src/data/agronomy/contracts.ts`.
import type {
  DataConfidence,
  EvidenceStatus,
  GoalKey as AgronomyGoalKey,
  ModelEvidenceStatus,
  RecommendationTrace,
  RiskLevel as AgronomyRiskLevel,
  StressScenarioAssumption,
} from "@/data/agronomy/contracts";

export type GoalKey = AgronomyGoalKey;
export type RiskLevel = AgronomyRiskLevel;
export type Accent = "forest" | "emerald" | "mint" | "amber" | "sky";

export interface LandInput {
  location: string;
  area: number; // acres
  soil: string;
  rainfallKey: "low" | "moderate" | "high";
  rainfallLabel: string;
  /** Representative annual scenario input used inside a broad rainfall category, not observed local rainfall. */
  rainfallMm: number;
  waterKey: "limited" | "seasonal" | "adequate" | "abundant";
  waterLabel: string;
  /** Internal availability index used only for relative scenario comparison, not litres or cubic metres. */
  availableWaterUnits: number;
  /** Scenario budget input in INR lakhs. */
  budgetLakhs: number;
  goal: GoalKey;
}

export interface ScoreMetrics {
  carbon: number;
  financial: number;
  water: number;
  resilience: number;
  biodiversity: number;
  risk: number; // lower is better
  total: number;
}

export interface CarbonScenarioOutput {
  evidenceStatus: "scenario-estimate";
  unit: "tCO2";
  horizonYears: number;
  methodology: string;
  output: number;
}

export interface FinancialScenarioOutput {
  evidenceStatus: "scenario-estimate";
  unit: "INR-lakhs";
  horizonYears: number;
  grossRevenueAssumption: number;
  establishmentCostAssumption: number;
  maintenanceCostAssumptionPerYear: number;
  budgetFeasibilityScale: number;
  output: number;
  note: string;
}

export interface WaterScenarioOutput {
  evidenceStatus: "scenario-estimate";
  unit: "internal-relative-index";
  requirement: number;
  availability: number;
  note: string;
}

export interface BiodiversityScenarioOutput {
  evidenceStatus: "model-score";
  score: number;
  note: string;
}

export interface RiskScenarioOutput {
  evidenceStatus: "model-score";
  sensitivityScore: number;
  safetyScore: number;
  category: RiskLevel;
  note: string;
}

export interface StrategyResult {
  id: string;
  code: "A" | "B" | "C";
  key: GoalKey;
  name: string;
  tagline: string;
  species: { id: string; name: string; share: number; category: string }[];
  initCostL: number;
  maintCostLyr: number;
  /** Scenario Carbon Estimate in tCO₂ for the modeled ten-year horizon. */
  carbonBudgetT: number;
  /** Derived per-acre scenario value retained for transparent comparison; not a measured rate. */
  scenarioCarbonEstimatePerAcre: number;
  /** Scenario Financial Estimate in INR lakhs over the modeled ten-year horizon. */
  returnL: number;
  returnShort: string;
  revenueL: number;
  /** Modeled Water Requirement in internal model units, not physical water volume. */
  waterRequiredUnits: number;
  /** Modeled Biodiversity Score, not field-survey biodiversity. */
  biodiversity: number;
  irreRisk: RiskLevel;
  /** Model safety score, 0-100 where higher means lower modeled sensitivity. */
  riskSafetyScore: number;
  rationale: string;
  metrics: ScoreMetrics;
  /** Provenance classifications for user-facing model outputs. */
  evidenceStatus: ModelEvidenceStatus;
  /** Reference coverage for the strategy mix; not statistical confidence. */
  dataConfidence: DataConfidence;
  /** Input factors used to rank this strategy for an explainable recommendation. */
  trace: RecommendationTrace;
  carbonScenario: CarbonScenarioOutput;
  financialScenario: FinancialScenarioOutput;
  waterScenario: WaterScenarioOutput;
  biodiversityScenario: BiodiversityScenarioOutput;
  riskScenario: RiskScenarioOutput;
  recommended: boolean;
}

export type ClimateScenario = StressScenarioAssumption;

export type OutputEvidenceStatus = EvidenceStatus;

export interface ZoningAllocation {
  carbon: number;
  income: number;
  biodiversity: number;
  conservation: number;
}

export type RedFlag = { tone: "warn" | "pass"; text: string };

export interface AdvisorMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}
