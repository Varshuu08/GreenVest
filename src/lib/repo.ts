// ─────────────────────────────────────────────────────────────
// GREENVEST REPOSITORY (demo)
//
// A thin persistence seam. Phase-3 wires Supabase here; in the
// sandbox it stores records in localStorage so the product and
// "demo mode" never break. Swap `persistAnalysis` etc. for API
// calls to the Express backend when env credentials are present.
// ─────────────────────────────────────────────────────────────
import type { LandInput, StrategyResult, ZoningAllocation } from "@/logic/types";

export interface SavedAnalysis {
  id: string;
  createdAt: number;
  land: LandInput;
  strategyId: string;
  strategies: StrategyResult[];
  score: number;
  carbon: number;
  returnL: number;
  recommendedName: string;
  code: string;
  zoning?: ZoningAllocation;
}

const KEY = "greenvest.analyses.v1";

export function hydrate(): SavedAnalysis[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return readonlySeed();
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : readonlySeed();
  } catch {
    return readonlySeed();
  }
}

function readonlySeed(): SavedAnalysis[] {
  // Kept out of persistence since it belongs to the demo account boot.
  return [];
}

function persist(list: SavedAnalysis[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — harmless in demo */
  }
}

export function saveAnalysis(a: Omit<SavedAnalysis, "id" | "createdAt">): SavedAnalysis {
  const rec: SavedAnalysis = { ...a, id: `an_${Date.now()}`, createdAt: Date.now() };
  const list = hydrate().filter((x) => x.id !== rec.id);
  persist([rec, ...list]);
  return rec;
}

export function deleteAnalysis(id: string) {
  persist(hydrate().filter((x) => x.id !== id));
}

export function duplicateAnalysis(id: string) {
  const src = hydrate().find((x) => x.id === id);
  if (!src) return null;
  const copy: SavedAnalysis = {
    ...src,
    id: `an_${Date.now()}`,
    createdAt: Date.now(),
    // simulate "Duplicate" → same inputs, re-created as a fresh analysis
  };
  persist([copy, ...hydrate().filter((x) => x.id !== id)]);
  return copy;
}

