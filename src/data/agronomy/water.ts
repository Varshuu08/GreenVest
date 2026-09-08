import type { WaterProfile } from "@/data/agronomy/contracts";
import { CANONICAL_MODEL_SPEC } from "@/data/agronomy/modelAssumptions";

export const WATER_OPTIONS: WaterProfile[] = CANONICAL_MODEL_SPEC.controlledVocabulary.waterAvailabilityScenarios.map((scenario) => ({
  key: scenario.key,
  label: scenario.label,
  availabilityIndex: scenario.availabilityIndex,
  unit: "internal-relative-index",
  evidenceStatus: "scenario-estimate",
  note: "Internal scenario index for relative water-fit comparison. It is not a physical irrigation volume or water-rights assessment.",
}));

export function waterScenarioFor(key: string) {
  return WATER_OPTIONS.find((scenario) => scenario.key === key) ?? WATER_OPTIONS[1];
}