import type { LandInput, StrategyResult } from "@/logic/types";
import { MODEL_ASSUMPTIONS } from "@/data/agronomy";

const inrFormat = (lakhs: number) => `₹${Math.round(lakhs)}L`;
const recommendation = MODEL_ASSUMPTIONS.scoring.recommendation;

export function pickRecommended(strategies: StrategyResult[]): StrategyResult {
  return [...strategies].sort((a, b) => b.metrics.total - a.metrics.total)[0];
}

export function rationaleFor(strat: StrategyResult, land: LandInput): string {
  const budgetShort = inrFormat(strat.initCostL);
  const waterWord = land.waterKey === "abundant" || land.waterKey === "adequate" ? "higher" : "limited";
  const feasible = strat.waterRequiredUnits <= land.availableWaterUnits * 1.05;

  const reasons: string[] = [];
  if (feasible)
    reasons.push(`its modeled water requirement (~${Math.round(strat.waterRequiredUnits)} index units) stays within the selected ${waterWord}-availability index (~${Math.round(land.availableWaterUnits)})`);
  else reasons.push(`its modeled water requirement (~${Math.round(strat.waterRequiredUnits)} index units) is tight against the selected availability index (~${Math.round(land.availableWaterUnits)})`);

  const budgetOk = strat.initCostL <= land.budgetLakhs;
  reasons.push(budgetOk ? `its initial investment assumption fits the ₹${Math.round(land.budgetLakhs)}L scenario budget` : `its initial investment assumption (~${budgetShort}) exceeds the selected scenario budget`);

  if (strat.metrics.carbon >= recommendation.strongCarbonScore) reasons.push("it has a stronger modeled long-horizon carbon score");
  if (strat.metrics.financial >= recommendation.financialAlignmentScore) reasons.push("its scenario financial score aligns with your selected goal");

  return `This is the highest-ranked modeled option for your current inputs because ${reasons.slice(0, 3).join(", ")}. Agronomic suitability remains a reference-based screen and needs site validation.`;
}

/** Why-not a particular non-recommended strategy — warns using its real weaknesses. */
export function whyNotThis(strat: StrategyResult, land: LandInput): string {
  const lines: string[] = [];
  if (strat.metrics.water < recommendation.lowWaterFitScore || strat.waterRequiredUnits > land.availableWaterUnits * recommendation.waterConstraintMultiplier) {
    lines.push(
      `its modeled water requirement (~${Math.round(strat.waterRequiredUnits)} index units) exceeds the selected availability index (~${Math.round(land.availableWaterUnits)}), raising model feasibility and climate sensitivity.`
    );
  } else if (strat.key === "return" && strat.metrics.water < recommendation.returnFocusWaterFitScore) {
    lines.push("its higher modeled financial outcome comes with a less favourable water-fit score under these inputs.");
  }
  if (strat.irreRisk === "high" || strat.irreRisk === "medium-high") {
    lines.push(`the model assigns higher market and climate sensitivity (${strat.irreRisk}).`);
  }
  if (strat.metrics.carbon < 60) {
    lines.push(`its Scenario Carbon Estimate is lower (~${strat.carbonBudgetT} tCO₂ over the modeled horizon)`);
  }
  if (strat.initCostL > land.budgetLakhs) {
    lines.push(`initial capex (~${strat.initCostL}L) stretches beyond your ₹${Math.round(land.budgetLakhs)}L budget.`);
  }
  if (lines.length === 0) lines.push("it scores lower on the weighted balance for your stated goal.");
  return `${strat.name} is not the top modeled option for these inputs because ${lines.join(" Also, ")}`;
}

/** Worst-case verdict + suggested pivot wording. */
export function worstCaseVerdict(
  strat: StrategyResult,
  stressed: { total: number; riskLow: boolean; nameOk: string }
): { verdict: "STILL VIABLE" | "REQUIRES ADJUSTMENT"; text: string; pivot: string | null } {
  const weak = stressed.total < recommendation.worstCaseViabilityScore || !stressed.riskLow;
  if (!weak)
    return {
      verdict: "STILL VIABLE",
      text: "Under this illustrative combined stress, the model score remains above its internal viability threshold. This is not a guarantee of field or investment performance.",
      pivot: null,
    };
  return {
    verdict: "REQUIRES ADJUSTMENT",
    text: `${strat.name} becomes more sensitive under the illustrative severe water and market assumptions (modeled score ${stressed.total}). Review lower-demand, locally suitable alternatives.`,
    pivot: "Consider validating a locally suitable lower-demand mix, along with drainage, mulching, soil-moisture conservation and establishment-irrigation planning where appropriate.",
  };
}
