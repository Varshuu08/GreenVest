import type { CarbonAssumption } from "@/data/agronomy/contracts";
import { MODEL_ASSUMPTIONS, SPECIES_SCENARIO_ASSUMPTIONS } from "@/data/agronomy/modelAssumptions";

/**
 * Carbon-methodology boundary. Until an evidence-backed methodology is wired
 * in, these inputs remain explicit scenario assumptions only.
 */
export const CARBON_METHODOLOGY = {
  status: "scenario-estimate" as const,
  horizonYears: MODEL_ASSUMPTIONS.metadata.horizonYears,
  unit: "tCO2 over modeled horizon" as const,
  formula: "scenario carbon coefficient × modeled area × screening response × growth multiplier × horizon factor",
  limitation: "Not a site measurement, biomass inventory, carbon-credit baseline, monitoring plan or verification methodology.",
};

export const CARBON_ASSUMPTIONS_BY_SPECIES = new Map<string, CarbonAssumption>(
  SPECIES_SCENARIO_ASSUMPTIONS.map((assumption) => [assumption.speciesId, assumption.carbon])
);