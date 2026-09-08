import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { ClimateScenario, LandInput, StrategyResult, ZoningAllocation } from "@/logic/types";
import { WATER_OPTIONS, RAINFALL_OPTIONS } from "@/data/plantations";
import { buildStrategies } from "@/logic/engine";
import { pickRecommended } from "@/logic/recommend";
import { evaluateZoning, defaultZoning } from "@/logic/zoning";
import { computeOutcome, type LiveOutcome } from "@/logic/outcome";
import { CLIMATE_SCENARIOS } from "@/logic/scenarios";

/** Phase-1 demo land doubles as the "Reset Demo" baseline. */
export function defaultLandInput(): LandInput {
  return {
    location: "Coimbatore, Tamil Nadu",
    area: 25,
    soil: "Sandy Loam",
    rainfallKey: "moderate",
    rainfallLabel: RAINFALL_OPTIONS[1].label,
    rainfallMm: RAINFALL_OPTIONS[1].representativeAnnualMm,
    waterKey: "limited",
    waterLabel: WATER_OPTIONS[0].label,
    availableWaterUnits: WATER_OPTIONS[0].availabilityIndex,
    budgetLakhs: 15,
    goal: "balanced",
  };
}

interface SimState {
  land: LandInput;
  analyzed: boolean;
  analysisId: string | null;
  selectedId: string;
  scenarioName: string;
  worseOn: boolean;
  zoning: ZoningAllocation;
}

type Action =
  | { type: "ANALYZE"; land: LandInput }
  | { type: "SET_ANALYSIS_ID"; id: string | null }
  | { type: "SELECT"; id: string }
  | { type: "SCENARIO"; name: string }
  | { type: "WORST"; on: boolean }
  | { type: "ZONING"; z: ZoningAllocation }
  | { type: "RESET" };

const initialState = (): SimState => ({
  land: defaultLandInput(),
  analyzed: false,
  analysisId: null,
  selectedId: "",
  scenarioName: "Normal",
  worseOn: false,
  zoning: defaultZoning,
});

function reducer(state: SimState, a: Action): SimState {
  switch (a.type) {
    case "ANALYZE": {
      const strategies = buildStrategies(a.land);
      const rec = pickRecommended(strategies);
      return {
        ...state,
        land: a.land,
        analyzed: true,
        analysisId: null,
        selectedId: rec.id,
        scenarioName: "Normal",
        worseOn: false,
        zoning: defaultZoning,
      };
    }
    case "SELECT":
      return { ...state, selectedId: a.id };
    case "SET_ANALYSIS_ID":
      return { ...state, analysisId: a.id };
    case "SCENARIO":
      return { ...state, scenarioName: a.name, worseOn: false };
    case "WORST":
      return { ...state, worseOn: a.on };
    case "ZONING":
      return { ...state, zoning: a.z };
    case "RESET":
      return initialState();
    default:
      return state;
  }
}

export interface SimulationApi {
  land: LandInput;
  analyzed: boolean;
  analysisId: string | null;
  worseOn: boolean;
  strategies: StrategyResult[];
  recommended: StrategyResult | null;
  active: StrategyResult | null;
  outcome: LiveOutcome | null;
  scenario: ClimateScenario;
  zoning: ZoningAllocation;
  zoningResult: ReturnType<typeof evaluateZoning> | null;
  selectStrategy: (id: string) => void;
  commitLand: (l: LandInput) => void;
  setAnalysisId: (id: string | null) => void;
  setScenario: (name: string) => void;
  setWorstCase: (on: boolean) => void;
  setZoning: (z: ZoningAllocation) => void;
  reset: () => void;
}

const SimCtx = createContext<SimulationApi | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const land = state.land;
  const strategies = useMemo(() => (state.analyzed ? buildStrategies(land) : []), [state.analyzed, land]);

  const recommended = useMemo(
    () => strategies.find((s) => s.id === state.selectedId) ?? pickRecommended(strategies) ?? null,
    [strategies, state.selectedId]
  );

  const active = recommended;

  const scenario = useMemo(
    () => CLIMATE_SCENARIOS.find((s) => s.name === state.scenarioName) ?? CLIMATE_SCENARIOS[0],
    [state.scenarioName]
  );

  const outcome = useMemo<LiveOutcome | null>(() => {
    if (!active) return null;
    return computeOutcome(land, active, scenario.name, state.worseOn);
  }, [land, active, scenario, state.worseOn]);

  const zoningResult = useMemo(() => {
    if (!state.analyzed) return null;
    return evaluateZoning(state.zoning, land, state.worseOn ? "Water Scarcity" : "Normal");
  }, [state.zoning, land, state.worseOn, state.analyzed]);

  const api: SimulationApi = {
    land,
    analyzed: state.analyzed,
    analysisId: state.analysisId,
    worseOn: state.worseOn,
    strategies,
    recommended,
    active,
    outcome,
    scenario,
    zoningResult,
    zoning: state.zoning,
    selectStrategy: (id) => dispatch({ type: "SELECT", id }),
    commitLand: (l) => dispatch({ type: "ANALYZE", land: l }),
    setAnalysisId: (id) => dispatch({ type: "SET_ANALYSIS_ID", id }),
    setScenario: (name) => dispatch({ type: "SCENARIO", name }),
    setWorstCase: (on) => dispatch({ type: "WORST", on }),
    setZoning: (z) => dispatch({ type: "ZONING", z }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return <SimCtx.Provider value={api}>{children}</SimCtx.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimCtx);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
