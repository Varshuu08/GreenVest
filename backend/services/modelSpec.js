import { readFileSync } from "node:fs";

/**
 * Shared canonical assumptions consumed by both the browser engine and the
 * Express adapter. This file contains scenario coefficients only, never
 * measured agricultural, carbon, irrigation or market data.
 */
export const MODEL_SPEC = JSON.parse(
  readFileSync(new URL("../../shared/greenvest-model-spec.json", import.meta.url), "utf8")
);