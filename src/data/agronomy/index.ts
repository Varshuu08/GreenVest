import { validateAgronomyCatalog } from "@/data/agronomy/validation";
import { AGRICULTURAL_SPECIES, SCENARIO_SPECIES_MODELS } from "@/data/agronomy/species";
import { STRATEGY_BLUEPRINTS } from "@/data/agronomy/modelAssumptions";
import { AGRONOMY_REFERENCE_FACTS } from "@/data/agronomy/referenceFacts";

export * from "@/data/agronomy/contracts";
export * from "@/data/agronomy/sources";
export * from "@/data/agronomy/referenceFacts";
export * from "@/data/agronomy/soil";
export * from "@/data/agronomy/climate";
export * from "@/data/agronomy/water";
export * from "@/data/agronomy/locations";
export * from "@/data/agronomy/modelAssumptions";
export * from "@/data/agronomy/carbon";
export * from "@/data/agronomy/economics";
export * from "@/data/agronomy/species";
export * from "@/data/agronomy/validation";
export * from "@/data/agronomy/importBoundary";

export const CATALOG_VALIDATION = validateAgronomyCatalog(
  AGRICULTURAL_SPECIES,
  SCENARIO_SPECIES_MODELS,
  STRATEGY_BLUEPRINTS,
  AGRONOMY_REFERENCE_FACTS
);

if (!CATALOG_VALIDATION.valid) {
  throw new Error(`Invalid GreenVest agronomy catalog: ${CATALOG_VALIDATION.issues.map((item) => item.message).join(" ")}`);
}