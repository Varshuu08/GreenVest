import type { SoilProfile } from "@/data/agronomy/contracts";
import { CANONICAL_MODEL_SPEC } from "@/data/agronomy/modelAssumptions";

export const SOIL_PROFILES: SoilProfile[] = CANONICAL_MODEL_SPEC.controlledVocabulary.soils.map((soil) => ({
  id: soil,
  label: soil,
  evidenceStatus: "insufficient-data",
  note: "Controlled vocabulary for first-pass screening only. Texture, depth, pH, salinity, drainage and hard-pan conditions require site verification.",
}));

export const SOIL_TYPES = SOIL_PROFILES.map((soil) => soil.id);

export function isSupportedSoil(value: string): value is (typeof SOIL_TYPES)[number] {
  return SOIL_TYPES.includes(value as (typeof SOIL_TYPES)[number]);
}