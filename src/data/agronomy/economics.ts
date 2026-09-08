import type { FinancialAssumption } from "@/data/agronomy/contracts";
import { MODEL_ASSUMPTIONS, SPECIES_SCENARIO_ASSUMPTIONS } from "@/data/agronomy/modelAssumptions";

/** Financial-scenario boundary; does not contain market quotes, yields or investment advice. */
export const FINANCIAL_METHODOLOGY = {
  status: "scenario-estimate" as const,
  horizonYears: MODEL_ASSUMPTIONS.metadata.horizonYears,
  unit: "INR lakhs over modeled horizon" as const,
  stages: ["revenue assumption", "establishment-cost assumption", "maintenance-cost assumption", "net scenario financial outcome"] as const,
  limitation: "Actual revenue, costs, taxes, financing, survival, yield and price conditions must be validated locally.",
};

export const FINANCIAL_ASSUMPTIONS_BY_SPECIES = new Map<string, FinancialAssumption>(
  SPECIES_SCENARIO_ASSUMPTIONS.map((assumption) => [assumption.speciesId, assumption.financial])
);