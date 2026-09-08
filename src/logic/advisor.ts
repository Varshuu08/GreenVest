import type { LandInput, StrategyResult } from "@/logic/types";
import type { LiveOutcome } from "@/logic/outcome";
import { factsForSpecies } from "@/data/agronomy";

export interface AdvisorSnapshot {
  land: LandInput;
  active: StrategyResult | null;
  outcome?: LiveOutcome | null;
  strategies: StrategyResult[];
  scenarioName: string;
  worstOn: boolean;
}

type Template = (snapshot: AdvisorSnapshot) => string;

function highestScenarioFinance(strategies: StrategyResult[]) {
  return [...strategies].sort((a, b) => b.returnL - a.returnL)[0];
}

function current(snapshot: AdvisorSnapshot) {
  const active = snapshot.active;
  const outcome = snapshot.outcome;
  return {
    carbon: outcome?.carbonT ?? active?.carbonBudgetT ?? 0,
    finance: outcome?.returnL ?? active?.returnL ?? 0,
    water: outcome?.reqWater ?? active?.waterRequiredUnits ?? 0,
    availability: outcome?.availWater ?? snapshot.land.availableWaterUnits,
    resilience: outcome?.resiliencePct ?? active?.metrics.resilience ?? 0,
    score: outcome?.total ?? active?.metrics.total ?? 0,
    risk: outcome?.riskLevel ?? active?.irreRisk ?? "not assessed",
  };
}

function screeningNote(strategy: StrategyResult | null) {
  if (!strategy) return "";
  const fact = factsForSpecies(strategy.species.map((species) => species.id))[0];
  return fact ? ` Reference screening reminder: ${fact.implication}` : " Validate soil depth, drainage, planting material and local records before implementation.";
}

// The advisor explains current model output. It does not calculate or claim measurements.
const INTENTS: { match: RegExp; answer: Template }[] = [
  {
    match: /why.*(recommend|is[ b]+recommended|top|best)/i,
    answer: (snapshot) => {
      const strategy = snapshot.active;
      if (!strategy) return "Run a land analysis first and I can explain the reference screening and scenario assumptions used for that parcel.";
      const model = current(snapshot);
      return `${strategy.name} is the highest-ranked modeled option for your ${snapshot.land.area}-acre ${snapshot.land.soil} land input, ${snapshot.land.rainfallLabel}, ${snapshot.land.waterLabel.toLowerCase()} water scenario and ₹${Math.round(snapshot.land.budgetLakhs)}L scenario budget. Under the "${snapshot.scenarioName}" assumption, it shows a Scenario Carbon Estimate of ~${model.carbon} tCO₂, a Scenario Financial Estimate of ~₹${model.finance}L and a modeled water requirement of ~${model.water} against an availability index of ~${model.availability}. The GreenVest Score (${model.score}/100) is a weighted scenario ranking, not a guarantee.${screeningNote(strategy)}`;
    },
  },
  {
    match: /what happens if rainfall decreases|drier|less rain/i,
    answer: (snapshot) => {
      const model = current(snapshot);
      return `The "Drier Climate" control is an illustrative stress assumption, not a forecast. It reduces the model's rainfall/growth inputs, then recalculates the Scenario Carbon Estimate, Scenario Financial Estimate, modeled water requirement and risk sensitivity. Your current "${snapshot.scenarioName}" view shows ~${model.carbon} tCO₂ and a resilience score of ${model.resilience}/100. Actual response depends on rainfall timing, soil depth, drainage, planting material, establishment care and irrigation availability.`;
    },
  },
  {
    match: /highest return|max(re|imiz).*return|most (profit|return)/i,
    answer: (snapshot) => {
      const strategy = highestScenarioFinance(snapshot.strategies);
      if (!strategy) return "Analyse your land to compare the scenario financial estimates.";
      return `${strategy.name} has the highest Scenario Financial Estimate in the current model (~₹${Math.round(strategy.returnL)}L over the modeled horizon). Its modeled water requirement is ~${Math.round(strategy.waterRequiredUnits)} index units and its model sensitivity category is ${strategy.irreRisk}. This comparison reflects assumptions, not a market price, cash-flow forecast or guaranteed profit.${screeningNote(strategy)}`;
    },
  },
  {
    match: /why is (strategy )?c risky|strategy c/i,
    answer: (snapshot) => {
      const strategy = snapshot.strategies.find((item) => item.code === "C");
      if (!strategy) return "Analyse the land first to compare Strategy C with the selected conditions.";
      return `${strategy.name} ranks lower for this input set because its modeled water requirement (~${Math.round(strategy.waterRequiredUnits)} index units) and model sensitivity are higher than the current mix. That is a scenario trade-off based on your selected water availability, budget and goal - not a statement that the crop will fail. Confirm local water, drainage, cultivar or clone and market context before treating it as unsuitable.${screeningNote(strategy)}`;
    },
  },
  {
    match: /increase carbon|carbon capture/i,
    answer: () =>
      "In GreenVest, increasing native/mixed forestry or biodiversity allocation changes the Scenario Carbon Estimate and biodiversity heuristic. It does not prove measured sequestration or carbon-credit eligibility. Use the Zoning screen to compare the modeled trade-off, then validate species mix, survival, growth, baseline, monitoring and verification requirements with a local specialist.",
  },
  {
    match: /reduce water|lower water|water usage/i,
    answer: (snapshot) => {
      const strategy = snapshot.active;
      const model = current(snapshot);
      return `The current model shows a water requirement of ~${model.water} index units against ~${model.availability} selected availability units. GreenVest's index is not an irrigation schedule. Consider reviewing lower-demand species options in the scenario model and, where locally appropriate, use practices such as mulching, soil-moisture conservation, drainage and supplemental establishment irrigation. Their effect depends on soil, climate, planting density and management.${screeningNote(strategy)}`;
    },
  },
  {
    match: /improve resilience|more resilient|robust|bounce back/i,
    answer: (snapshot) => {
      const model = current(snapshot);
      return `GreenVest treats resilience (${model.resilience}/100 in the current scenario) as a model sensitivity indicator, not a probability of success. The model generally responds to a less water-intensive mix, stronger water-fit score and more diverse planting allocation. Use the stress-test and zoning controls to compare those assumptions, then validate drainage, soil moisture, local climate records and management capacity on site.`;
    },
  },
  {
    match: /budget\b|increase my budget|more capital|raise.*fund/i,
    answer: (snapshot) => {
      if (!snapshot.active) return "Analyze your land first.";
      const model = current(snapshot);
      return `A higher scenario budget can change the model's budget-feasibility constraint and therefore the modeled carbon and financial outputs. It does not resolve water, drainage, climate or market constraints. With your current ₹${Math.round(snapshot.land.budgetLakhs)}L scenario budget, ${snapshot.active.name} shows ~₹${model.finance}L as a Scenario Financial Estimate. Test an alternative budget in the Simulator and validate actual establishment, maintenance and financing costs locally.`;
    },
  },
];

export function askAdvisor(snapshot: AdvisorSnapshot, question: string): string {
  for (const intent of INTENTS) {
    if (intent.match.test(question)) return intent.answer(snapshot);
  }
  const strategy = snapshot.active;
  if (!strategy) return "No analysis yet - head to Analyze Land and I will explain the reference screening and scenario model for your inputs.";
  const model = current(snapshot);
  return `For your current ${strategy.name} scenario, GreenVest shows ~${model.carbon} tCO₂ as a Scenario Carbon Estimate, ~₹${model.finance}L as a Scenario Financial Estimate, a modeled water requirement of ~${model.water} index units and a scenario risk category of ${model.risk}. These are internal scenario outputs, not measured or guaranteed outcomes. I can explain the assumptions behind soil/rainfall screening, water fit, finance or climate sensitivity.${screeningNote(strategy)}`;
}

export const SUGGESTED_QUESTIONS = [
  "Why was this strategy recommended?",
  "What happens if rainfall decreases?",
  "Why is Strategy C risky?",
  "How can I improve resilience?",
  "What happens if my budget increases?",
  "Which strategy has the highest return?",
];