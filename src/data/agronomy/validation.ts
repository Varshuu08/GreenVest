import type {
  AgriculturalReferenceFact,
  AgriculturalSpecies,
  CanonicalSpeciesModel,
  SoilCategory,
  StrategyBlueprint,
  ValidationIssue,
  ValidationResult,
} from "@/data/agronomy/contracts";
import { CANONICAL_MODEL_SPEC } from "@/data/agronomy/modelAssumptions";

function issue(path: string, code: ValidationIssue["code"], message: string): ValidationIssue {
  return { path, code, message };
}

/** Validates canonical reference + assumption records before the engine consumes them. */
export function validateAgronomyCatalog(
  species: AgriculturalSpecies[],
  models: CanonicalSpeciesModel[],
  blueprints: StrategyBlueprint[],
  facts: AgriculturalReferenceFact[]
): ValidationResult<true> {
  const issues: ValidationIssue[] = [];
  const allowedSoils = new Set(CANONICAL_MODEL_SPEC.controlledVocabulary.soils);
  const speciesIds = new Set<string>();
  const modelIds = new Set<string>();
  const blueprintIds = new Set<string>();
  const factIds = new Set<string>();

  if (allowedSoils.size !== CANONICAL_MODEL_SPEC.controlledVocabulary.soils.length) {
    issues.push(issue("controlledVocabulary.soils", "duplicate", "Controlled soil vocabulary contains duplicates."));
  }
  CANONICAL_MODEL_SPEC.controlledVocabulary.rainfallScenarios.forEach((scenario, index, array) => {
    if (!scenario.label || !Number.isFinite(scenario.representativeAnnualMm) || scenario.representativeAnnualMm < 0) {
      issues.push(issue(`rainfallScenarios[${index}]`, "invalid-value", "Rainfall scenario needs a label and non-negative representative input."));
    }
    if (array.findIndex((item) => item.key === scenario.key) !== index) {
      issues.push(issue(`rainfallScenarios[${index}].key`, "duplicate", `Duplicate rainfall scenario key: ${scenario.key}`));
    }
  });
  CANONICAL_MODEL_SPEC.controlledVocabulary.waterAvailabilityScenarios.forEach((scenario, index, array) => {
    if (!scenario.label || !Number.isFinite(scenario.availabilityIndex) || scenario.availabilityIndex < 0) {
      issues.push(issue(`waterAvailabilityScenarios[${index}]`, "invalid-value", "Water scenario needs a label and non-negative internal availability index."));
    }
    if (array.findIndex((item) => item.key === scenario.key) !== index) {
      issues.push(issue(`waterAvailabilityScenarios[${index}].key`, "duplicate", `Duplicate water scenario key: ${scenario.key}`));
    }
  });

  species.forEach((record, index) => {
    if (!record.id || !record.commonName) issues.push(issue(`species[${index}]`, "missing", "Each species needs an id and common name."));
    if (speciesIds.has(record.id)) issues.push(issue(`species[${index}].id`, "duplicate", `Duplicate species id: ${record.id}`));
    speciesIds.add(record.id);
    if (record.referenceFacts.length === 0) {
      issues.push(issue(`species[${index}].referenceFacts`, "missing", "Species needs reference fact ids or an explicit insufficient-data status."));
    }
  });

  facts.forEach((fact, index) => {
    if (factIds.has(fact.id)) issues.push(issue(`facts[${index}].id`, "duplicate", `Duplicate reference fact id: ${fact.id}`));
    factIds.add(fact.id);
    if (!speciesIds.has(fact.speciesId)) issues.push(issue(`facts[${index}].speciesId`, "unknown-reference", `Reference fact targets an unknown species: ${fact.speciesId}`));
    if (!fact.fact || !fact.implication) issues.push(issue(`facts[${index}]`, "missing", "Reference fact needs both a fact and a practical implication."));
    if (!fact.source.organisation || !fact.source.title || !fact.source.sourceUrl) {
      issues.push(issue(`facts[${index}].source`, "missing", "Reference fact needs source organisation, title and URL."));
    }
  });

  species.forEach((record, index) => {
    record.referenceFacts.forEach((factId) => {
      if (!factIds.has(factId)) issues.push(issue(`species[${index}].referenceFacts`, "unknown-reference", `Unknown reference fact id: ${factId}`));
    });
  });

  models.forEach((model, index) => {
    const assumption = model.assumption;
    if (modelIds.has(assumption.speciesId)) issues.push(issue(`models[${index}].speciesId`, "duplicate", `Duplicate scenario assumption: ${assumption.speciesId}`));
    modelIds.add(assumption.speciesId);
    if (!speciesIds.has(assumption.speciesId)) issues.push(issue(`models[${index}].speciesId`, "unknown-reference", "Scenario assumption references an unknown species."));
    if (assumption.rainfallScreeningRangeMm[0] < 0 || assumption.rainfallScreeningRangeMm[1] < assumption.rainfallScreeningRangeMm[0]) {
      issues.push(issue(`models[${index}].rainfallScreeningRangeMm`, "invalid-value", "Rainfall screening range must be non-negative and ascending."));
    }
    if (assumption.water.unit !== "internal-relative-index") issues.push(issue(`models[${index}].water.unit`, "invalid-unit", "Current water assumptions must use the internal-relative-index unit."));
    if (assumption.carbon.unit !== "tCO2-per-acre-over-modeled-horizon") issues.push(issue(`models[${index}].carbon.unit`, "invalid-unit", "Carbon assumptions must declare the modeled-horizon unit."));
    if (assumption.financial.unit !== "INR-lakhs") issues.push(issue(`models[${index}].financial.unit`, "invalid-unit", "Financial assumptions must declare INR-lakhs."));
    assumption.scenarioSoilFit.forEach((soil) => {
      if (!allowedSoils.has(soil)) issues.push(issue(`models[${index}].scenarioSoilFit`, "inconsistent-vocabulary", `Unsupported soil category: ${soil}`));
    });
    [assumption.water.indexPerAcre, assumption.carbon.coefficientTco2PerAcre, assumption.growthMultiplier, assumption.financial.establishmentCostLakhsPerAcre, assumption.financial.maintenanceCostLakhsPerAcreYear, assumption.financial.revenueLakhsPerAcreHorizon].forEach((value) => {
      if (!Number.isFinite(value) || value < 0) issues.push(issue(`models[${index}]`, "invalid-value", "Scenario coefficients must be finite and non-negative."));
    });
  });

  blueprints.forEach((blueprint, index) => {
    if (blueprintIds.has(blueprint.id)) issues.push(issue(`blueprints[${index}].id`, "duplicate", `Duplicate strategy id: ${blueprint.id}`));
    blueprintIds.add(blueprint.id);
    const sum = blueprint.mix.reduce((total, item) => total + item.share, 0);
    if (!blueprint.id || !blueprint.name || blueprint.mix.length === 0) issues.push(issue(`blueprints[${index}]`, "missing", "Strategy needs an id, name and species mix."));
    if (Math.abs(sum - 1) > 0.001) issues.push(issue(`blueprints[${index}].mix`, "invalid-value", "Strategy shares must sum to 1."));
    blueprint.mix.forEach((item) => {
      if (!modelIds.has(item.id)) issues.push(issue(`blueprints[${index}].mix`, "unknown-reference", `Unknown species in strategy: ${item.id}`));
      if (!Number.isFinite(item.share) || item.share <= 0) issues.push(issue(`blueprints[${index}].mix`, "invalid-value", "Strategy shares must be positive finite values."));
    });
  });

  speciesIds.forEach((id) => {
    if (!modelIds.has(id)) issues.push(issue("models", "missing", `Missing scenario assumption for species: ${id}`));
  });

  return issues.length ? { valid: false, issues } : { valid: true, data: true, issues: [] };
}

export type ExternalSpeciesRecord = {
  id?: unknown;
  commonName?: unknown;
  supportedSoils?: unknown;
  source?: unknown;
  unit?: unknown;
};

/**
 * Dataset-import boundary: normalize only fields GreenVest understands and
 * return validation issues for everything unresolved instead of inventing data.
 */
export function normalizeExternalSpeciesRecord(raw: ExternalSpeciesRecord): ValidationResult<{
  id: string;
  commonName: string;
  supportedSoils: SoilCategory[];
  source: string;
}> {
  const issues: ValidationIssue[] = [];
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const commonName = typeof raw.commonName === "string" ? raw.commonName.trim() : "";
  const source = typeof raw.source === "string" ? raw.source.trim() : "";
  const allowedSoils = new Set(CANONICAL_MODEL_SPEC.controlledVocabulary.soils);
  const soils = Array.isArray(raw.supportedSoils) ? raw.supportedSoils.filter((soil): soil is string => typeof soil === "string") : [];

  if (!id) issues.push(issue("id", "missing", "Dataset record is missing a species id."));
  if (!commonName) issues.push(issue("commonName", "missing", "Dataset record is missing a species name."));
  if (!source) issues.push(issue("source", "missing", "Dataset record has no provenance source."));
  if (!Array.isArray(raw.supportedSoils)) issues.push(issue("supportedSoils", "missing", "Dataset record needs controlled soil categories."));
  soils.forEach((soil) => {
    if (!allowedSoils.has(soil as SoilCategory)) issues.push(issue("supportedSoils", "inconsistent-vocabulary", `Unsupported soil category: ${soil}`));
  });
  if (raw.unit && raw.unit !== "internal-relative-index" && raw.unit !== "tCO2-per-acre-over-modeled-horizon" && raw.unit !== "INR-lakhs") {
    issues.push(issue("unit", "invalid-unit", "Dataset unit is not mapped to a GreenVest internal unit."));
  }

  if (issues.length) return { valid: false, issues };
  return { valid: true, data: { id, commonName, supportedSoils: soils as SoilCategory[], source }, issues: [] };
}
