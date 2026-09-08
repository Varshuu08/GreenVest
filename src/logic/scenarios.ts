import { STRESS_SCENARIO_ASSUMPTIONS, WORST_CASE_STRESS_ASSUMPTION } from "@/data/agronomy";
import type { ClimateScenario } from "@/logic/types";

/** Canonical illustrative stress-test assumptions, supplied by the central model catalog. */
export const CLIMATE_SCENARIOS: ClimateScenario[] = STRESS_SCENARIO_ASSUMPTIONS;

export const WORST_CASE = WORST_CASE_STRESS_ASSUMPTION;

export function findScenario(name: string) {
  return CLIMATE_SCENARIOS.find((scenario) => scenario.name === name) ?? CLIMATE_SCENARIOS[0];
}