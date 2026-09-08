import type { AgriculturalReferenceFact } from "@/data/agronomy/contracts";
import { AGRICULTURAL_SOURCES } from "@/data/agronomy/sources";

export const AGRONOMY_REFERENCE_FACTS: AgriculturalReferenceFact[] = [
  {
    id: "mango-soil-drainage",
    speciesId: "mango",
    topic: "soil-drainage",
    fact: "TNAU notes that mango can grow on a range of soils, including alluvial and lateritic soils, when the soil is deep and well drained; poor drainage is a concern.",
    implication: "Use the soil category only as a first screen. Confirm effective depth, drainage, pH and salinity through a site assessment before planting.",
    source: AGRICULTURAL_SOURCES.mango,
    evidenceStatus: "reference-based",
  },
  {
    id: "mango-water-management",
    speciesId: "mango",
    topic: "water-management",
    fact: "TNAU states that mango water needs vary with tree age, soil type and climate, and that young plants need regular watering during establishment.",
    implication: "The GreenVest water index is not an irrigation schedule. Validate seasonal supply and establishment irrigation locally.",
    source: AGRICULTURAL_SOURCES.mango,
    evidenceStatus: "reference-based",
  },
  {
    id: "cashew-soil-drainage",
    speciesId: "cashew",
    topic: "soil-drainage",
    fact: "TNAU describes deep, well-drained sandy loams without a hard pan as favourable for cashew and notes that water stagnation, flooding and poorly drained heavy clay are unsuitable.",
    implication: "Prioritise drainage checks and avoid treating a broad soil category as proof of suitability.",
    source: AGRICULTURAL_SOURCES.cashew,
    evidenceStatus: "reference-based",
  },
  {
    id: "cashew-rainfall-distribution",
    speciesId: "cashew",
    topic: "rainfall-climate",
    fact: "TNAU notes that cashew performance is influenced by seasonal distribution and that a defined dry period is important for good production; excessive rain and humidity during flowering can be problematic.",
    implication: "A single annual rainfall category cannot confirm suitability. Consider rainfall distribution, flowering season and local cultivar.",
    source: AGRICULTURAL_SOURCES.cashew,
    evidenceStatus: "reference-based",
  },
  {
    id: "coconut-soil-drainage",
    speciesId: "coconut",
    topic: "soil-drainage",
    fact: "TNAU identifies deep, well-drained sandy loam, laterite and alluvial situations as suitable coconut contexts and cautions against prolonged water stagnation and heavy, imperfectly drained soil.",
    implication: "Check drainage, soil depth and seasonal water table before including coconut in a planting mix.",
    source: AGRICULTURAL_SOURCES.coconut,
    evidenceStatus: "reference-based",
  },
  {
    id: "coconut-rainfall-distribution",
    speciesId: "coconut",
    topic: "rainfall-climate",
    fact: "TNAU emphasises rainfall distribution, soil moisture and drainage for coconut rather than relying only on an annual total; prolonged dry spells require water planning.",
    implication: "Use GreenVest rainfall as a representative scenario input, not as a location-wide climate measurement.",
    source: AGRICULTURAL_SOURCES.coconut,
    evidenceStatus: "reference-based",
  },
  {
    id: "teak-soil-drainage",
    speciesId: "teak",
    topic: "soil-drainage",
    fact: "TNAU forestry guidance describes well-drained sandy loam conditions for teak and flags shallow, hard-pan and waterlogged sites as poor contexts in its tree-cultivation guidance.",
    implication: "Confirm depth, drainage and locally suitable planting material before using teak as a major investment component.",
    source: AGRICULTURAL_SOURCES.teak,
    evidenceStatus: "reference-based",
  },
  {
    id: "bamboo-species-selection",
    speciesId: "bamboo",
    topic: "species-selection",
    fact: "ICAR documents bamboo as an agroforestry resource and describes multiple bamboo species and planting uses; this app does not identify a single recommended bamboo species.",
    implication: "Select a bamboo species with a local nursery, forest department or extension professional rather than treating the generic model entry as a prescription.",
    source: AGRICULTURAL_SOURCES.bamboo,
    evidenceStatus: "requires-local-validation",
  },
  {
    id: "silver-oak-site-selection",
    speciesId: "silver-oak",
    topic: "species-selection",
    fact: "Grevillea robusta occurs in region-specific agroforestry systems; suitability depends on local climate, elevation, companion crops and management.",
    implication: "Validate local provenance and the intended agroforestry configuration before planting silver oak.",
    source: AGRICULTURAL_SOURCES.silverOak,
    evidenceStatus: "requires-local-validation",
  },
  {
    id: "eucalyptus-site-selection",
    speciesId: "eucalyptus",
    topic: "species-selection",
    fact: "ICAR-CAFRI describes eucalyptus systems as site- and clone-specific, with configuration and local growing conditions influencing performance.",
    implication: "Do not infer universal water, yield or carbon performance from a scenario coefficient. Confirm clone, spacing, water context and local advisories.",
    source: AGRICULTURAL_SOURCES.eucalyptus,
    evidenceStatus: "requires-local-validation",
  },
  {
    id: "mixed-native-local-selection",
    speciesId: "mixed-native",
    topic: "species-selection",
    fact: "ICAR agroforestry resources describe region-specific species selection rather than one universal native mix.",
    implication: "Develop a locally appropriate native-species palette with a nursery or extension expert before implementation.",
    source: AGRICULTURAL_SOURCES.agroforestry,
    evidenceStatus: "requires-local-validation",
  },
];

export const AGRONOMY_REFERENCE_SUMMARY =
  "Agronomic suitability statements are reference-based screening guidance. Site-specific soil testing, drainage assessment, water planning, cultivar or clone selection, and local climate records are still required before capital is committed.";

export function factsForSpecies(speciesIds: string[]) {
  return AGRONOMY_REFERENCE_FACTS.filter((fact) => speciesIds.includes(fact.speciesId));
}