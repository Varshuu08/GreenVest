import type { RainfallScenarioProfile } from "@/data/agronomy/contracts";
import { CANONICAL_MODEL_SPEC } from "@/data/agronomy/modelAssumptions";

export const RAINFALL_OPTIONS: RainfallScenarioProfile[] = CANONICAL_MODEL_SPEC.controlledVocabulary.rainfallScenarios.map((scenario) => ({
  key: scenario.key,
  label: scenario.label,
  representativeAnnualMm: scenario.representativeAnnualMm,
  evidenceStatus: "scenario-estimate",
  note: "Representative annual scenario input for relative model screening. It is not observed rainfall for a location, district or year.",
}));

export function rainfallScenarioFor(key: string) {
  return RAINFALL_OPTIONS.find((scenario) => scenario.key === key) ?? RAINFALL_OPTIONS[1];
}