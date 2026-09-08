/**
 * ─────────────────────────────────────────────────────────────
 * SIMULATED DEMO DATA
 *
 * IMPORTANT: These values are static, illustrative DEMO SCENARIOS
 * used only by the guided demo and fallback states. They are not
 * scientifically validated measurements, carbon-credit estimates,
 * or investment forecasts. Live analysis pages use the current
 * rules-based scenario engine output instead.
 *
 * The UI layer reads ONLY from this module — it is never coupled
 * directly to a decision engine or an external AI API. Future
 * stages replace these exports with real outputs while keeping
 * the component layer unchanged.
 * ─────────────────────────────────────────────────────────────
 */

export const DEMO_MODE = true;

export const demoLand = {
  label: "Demo Farm Estate",
  areaAcres: 25,
  location: "Coimbatore, Tamil Nadu",
  region: "Western Ghats Foothills",
  soilType: "Sandy Loam",
  rainfall: "Moderate rainfall scenario",
  waterAvailability: "Limited water scenario",
  budget: "₹15,00,000",
  budgetShort: "₹15L",
  primaryGoal: "Balanced modeled outcome",
};

export const demoStrategy = {
  id: "balanced-agroforestry",
  name: "Balanced Agroforestry",
  summary:
    "A mixed canopy of timber, shade-native and fruit species layered over pasture to optimise carbon, water retention and diversified income.",
  status: "AI Recommended",
  score: 87,
  carbonTonnes: 612,
  returnShort: "₹28L",
  returnLabel: "₹28,00,000",
};

/** Demo-only series for an illustrative financial versus carbon scenario over the modeled horizon. */
export const impactSeries = [
  { year: "Y1", carbon: 38, investment: 18 },
  { year: "Y3", carbon: 90, investment: 42 },
  { year: "Y5", carbon: 190, investment: 76 },
  { year: "Y7", carbon: 320, investment: 122 },
  { year: "Y10", carbon: 470, investment: 194 },
  { year: "Y12", carbon: 612, investment: 280 },
];

/** Metric cards shown on the dashboard (all demo). */
export const dashboardMetrics = [
  {
    id: "land-area",
    label: "Land Area",
    value: 25,
    suffix: "acres",
    unit: "acres",
    decimals: 0,
    hint: "Registered plot size",
    tone: "emerald",
  },
  {
    id: "carbon",
    label: "Scenario Carbon Estimate",
    value: 612,
    suffix: "tCO₂",
    unit: "tCO₂",
    decimals: 0,
    hint: "Demo modeled horizon",
    tone: "forest",
  },
  {
    id: "return",
    label: "Scenario Financial Estimate",
    value: 28,
    prefix: "₹",
    suffix: "L",
    unit: "L",
    decimals: 0,
    hint: "Demo modeled 12-year scenario",
    tone: "amber",
  },
  {
    id: "score",
    label: "GreenVest Score",
    value: 87,
    suffix: "/100",
    unit: "/100",
    decimals: 0,
    hint: "Overall land viability",
    tone: "mint",
  },
] as const;

export const resilienceBreakdown = [
  { label: "Drought tolerance", pct: 82 },
  { label: "Flood resilience", pct: 90 },
  { label: "Soil health", pct: 78 },
  { label: "Water efficiency", pct: 74 },
  { label: "Biodiversity", pct: 88 },
];

/** Visual placeholder topic for pages still under construction. */
export const comingSoon = {
  badge: "Coming in next stage",
  note: "This module is scaffolding. The GreenVest engines that power this screen activate in a later stage of the build.",
};
