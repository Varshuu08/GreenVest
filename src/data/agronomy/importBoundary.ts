import type { EvidenceConfidence, EvidenceType, SoilCategory, ValidationResult } from "@/data/agronomy/contracts";
import { normalizeExternalSpeciesRecord } from "@/data/agronomy/validation";

/**
 * Dataset adapters provide this mapping rather than leaking provider-specific
 * CSV, Excel, API or database column names into GreenVest's engine.
 */
export interface DatasetColumnMapping {
  speciesId: string;
  commonName: string;
  supportedSoils: string;
  source: string;
  sourceUrl: string;
  evidenceType: string;
  confidence: string;
  unit?: string;
}

export type RawDatasetRecord = Record<string, unknown>;

export interface NormalizedReferenceSpeciesRecord {
  id: string;
  commonName: string;
  supportedSoils: SoilCategory[];
  provenance: {
    source: string;
    sourceUrl: string;
    evidenceType: EvidenceType;
    confidence: EvidenceConfidence;
  };
  unit?: string;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function soilValues(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/[;,|]/).map((part) => part.trim()).filter(Boolean);
  return value;
}

/**
 * Normalizes one external dataset row into GreenVest's internal reference
 * contract. Invalid/missing provenance, units or controlled categories are
 * returned as issues; the record is never silently promoted into the engine.
 */
export function normalizeMappedSpeciesRecord(
  record: RawDatasetRecord,
  mapping: DatasetColumnMapping
): ValidationResult<NormalizedReferenceSpeciesRecord> {
  const base = normalizeExternalSpeciesRecord({
    id: record[mapping.speciesId],
    commonName: record[mapping.commonName],
    supportedSoils: soilValues(record[mapping.supportedSoils]),
    source: record[mapping.source],
    unit: mapping.unit ? record[mapping.unit] : undefined,
  });
  const issues = [...base.issues];
  const sourceUrl = stringValue(record[mapping.sourceUrl]);
  const evidenceType = stringValue(record[mapping.evidenceType]) as EvidenceType;
  const confidence = stringValue(record[mapping.confidence]) as EvidenceConfidence;

  if (!sourceUrl) issues.push({ path: "sourceUrl", code: "missing", message: "Dataset record has no source URL for provenance." });
  if (mapping.unit && !stringValue(record[mapping.unit])) {
    issues.push({ path: "unit", code: "missing", message: "Dataset record has a mapped unit column but no unit value." });
  }
  if (!["government", "research", "agricultural_reference", "unresolved"].includes(evidenceType)) {
    issues.push({ path: "evidenceType", code: "invalid-value", message: "Dataset evidence type is not mapped to GreenVest's provenance vocabulary." });
  }
  if (!["high", "medium", "limited"].includes(confidence)) {
    issues.push({ path: "confidence", code: "invalid-value", message: "Dataset confidence is not mapped to GreenVest's confidence vocabulary." });
  }
  if (!base.data || issues.length) return { valid: false, issues };

  return {
    valid: true,
    data: {
      ...base.data,
      provenance: {
        source: base.data.source,
        sourceUrl,
        evidenceType,
        confidence,
      },
      unit: mapping.unit ? stringValue(record[mapping.unit]) : undefined,
    },
    issues: [],
  };
}