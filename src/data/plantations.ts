/**
 * Compatibility facade for legacy GreenVest imports.
 * Reference data, controlled vocabularies and scenario assumptions are
 * centralized in `src/data/agronomy/`.
 */
export {
  SOIL_TYPES,
  RAINFALL_OPTIONS,
  WATER_OPTIONS,
  STRATEGY_BLUEPRINTS,
  SCENARIO_SPECIES_MODELS as SPECIES,
  SCENARIO_MODEL_METADATA,
  PLANTATION_CAVEAT,
} from "@/data/agronomy";

export const GOALS = [
  { label: "Balanced", key: "balanced", blurb: "Modeled carbon + finance + feasibility" },
  { label: "Max Carbon", key: "carbon", blurb: "Prioritise the Scenario Carbon Estimate" },
  { label: "Max Return", key: "return", blurb: "Prioritise the Scenario Financial Estimate" },
] as const;