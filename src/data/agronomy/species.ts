import type { AgriculturalSpecies, CanonicalSpeciesModel } from "@/data/agronomy/contracts";
import { AGRONOMY_REFERENCE_FACTS } from "@/data/agronomy/referenceFacts";
import { SPECIES_SCENARIO_ASSUMPTIONS } from "@/data/agronomy/modelAssumptions";

export const AGRICULTURAL_SPECIES: AgriculturalSpecies[] = [
  { id: "mixed-native", commonName: "Mixed Native Forest", category: "carbon", accent: "forest", referenceFacts: ["mixed-native-local-selection"], referenceConfidence: "limited", referenceStatus: "insufficient-data" },
  { id: "teak", commonName: "Teak", scientificName: "Tectona grandis", category: "timber", accent: "amber", referenceFacts: ["teak-soil-drainage"], referenceConfidence: "medium", referenceStatus: "reference-based" },
  { id: "silver-oak", commonName: "Silver Oak", scientificName: "Grevillea robusta", category: "timber", accent: "emerald", referenceFacts: ["silver-oak-site-selection"], referenceConfidence: "limited", referenceStatus: "reference-based" },
  { id: "bamboo", commonName: "Bamboo", category: "carbon", accent: "mint", referenceFacts: ["bamboo-species-selection"], referenceConfidence: "limited", referenceStatus: "reference-based" },
  { id: "mango", commonName: "Mango Orchard", scientificName: "Mangifera indica", category: "fruit", accent: "amber", referenceFacts: ["mango-soil-drainage", "mango-water-management"], referenceConfidence: "high", referenceStatus: "reference-based" },
  { id: "coconut", commonName: "Coconut Palm", category: "fruit", accent: "sky", referenceFacts: ["coconut-soil-drainage", "coconut-rainfall-distribution"], referenceConfidence: "high", referenceStatus: "reference-based" },
  { id: "cashew", commonName: "Cashew Nut", category: "fruit", accent: "emerald", referenceFacts: ["cashew-soil-drainage", "cashew-rainfall-distribution"], referenceConfidence: "high", referenceStatus: "reference-based" },
  { id: "eucalyptus", commonName: "Eucalyptus", category: "timber", accent: "mint", referenceFacts: ["eucalyptus-site-selection"], referenceConfidence: "limited", referenceStatus: "reference-based" },
];

export const SCENARIO_SPECIES_MODELS: CanonicalSpeciesModel[] = AGRICULTURAL_SPECIES.map((reference) => {
  const assumption = SPECIES_SCENARIO_ASSUMPTIONS.find((item) => item.speciesId === reference.id);
  if (!assumption) throw new Error(`Missing scenario assumption for species: ${reference.id}`);
  return { reference, assumption };
});

export function speciesModelFor(id: string) {
  return SCENARIO_SPECIES_MODELS.find((model) => model.reference.id === id);
}

export function referenceFactsForSpecies(speciesIds: string[]) {
  return AGRONOMY_REFERENCE_FACTS.filter((fact) => speciesIds.includes(fact.speciesId));
}