import { AnimatePresence, motion } from "framer-motion";
import { X, Info, Leaf, Coins, Layers, CloudRain, Droplets, TriangleAlert } from "lucide-react";
import { PLANTATION_CAVEAT, SCENARIO_MODEL_METADATA } from "@/data/plantations";
import { AGRONOMY_REFERENCE_SUMMARY, factsForSpecies } from "@/data/agronomy";
import type { LandInput, StrategyResult } from "@/logic/types";

export function AssumptionModal({
  open,
  onClose,
  land,
  strat,
}: {
  open: boolean;
  onClose: () => void;
  land: LandInput;
  strat: StrategyResult | null;
}) {
  const referenceFacts = strat ? factsForSpecies(strat.species.map((species) => species.id)).slice(0, 3) : [];
  const sources = [...new Map(referenceFacts.map((fact) => [fact.source.sourceUrl, fact.source])).values()];
  const rows = [
    {
      Icon: Leaf,
      t: "Scenario Carbon Estimate",
      d: `${SCENARIO_MODEL_METADATA.carbon} Horizon: ${SCENARIO_MODEL_METADATA.horizon}.`,
    },
    {
      Icon: Coins,
      t: "Initial investment assumption",
      d: `Model setup assumption: ₹${Math.round(strat?.initCostL ?? 0)}L against a ₹${Math.round(land.budgetLakhs)}L scenario budget. Financing, taxes, land cost and local quotations are excluded.`,
    },
    {
      Icon: Droplets,
      t: "Modeled water and maintenance inputs",
      d: `${SCENARIO_MODEL_METADATA.water} The maintenance figure is an internal scenario assumption, not a contractor quote or farm budget.`,
    },
    {
      Icon: Layers,
      t: "Scenario Financial Estimate",
      d: `${SCENARIO_MODEL_METADATA.finance} Maintenance and revenue are separated internally before GreenVest displays the modeled outcome.`,
    },
    {
      Icon: CloudRain,
      t: "Rainfall and stress assumptions",
      d: `Selected input: ${land.rainfallLabel}. ${SCENARIO_MODEL_METADATA.rainfall} Climate stress settings are illustrative model assumptions, not climate forecasts.`,
    },
    {
      Icon: TriangleAlert,
      t: "Reference screening and limitations",
      d: `${AGRONOMY_REFERENCE_SUMMARY} Local geospatial data, soil tests and measured water records are not connected in this prototype.`,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-slate-900/10 bg-white p-6 shadow-2xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900/5 text-forest-700">
                  <Info className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-forest-950">View Assumptions</h3>
                  <p className="text-xs text-slate-400">How these numbers were estimated</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-forest-900/5 hover:text-forest-900" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {rows.map((r) => (
                <div key={r.t} className="flex gap-3 rounded-xl border border-slate-900/5 bg-forest-50/50 p-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-forest-600 shadow-sm">
                    <r.Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-forest-950">{r.t}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{r.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {sources.length > 0 && (
              <div className="mt-5 rounded-2xl border border-forest-900/5 bg-forest-50/60 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-forest-700">Reference-based agronomy notes</p>
                <div className="mt-2 space-y-2">
                  {referenceFacts.map((fact) => (
                    <p key={`${fact.speciesId}-${fact.topic}`} className="text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold text-forest-800">{fact.fact}</span> {fact.implication}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-forest-700">Sources</p>
                <div className="mt-1.5 space-y-1.5">
                  {sources.map((source) => (
                    <a
                      key={source.sourceUrl}
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs leading-relaxed text-forest-700 underline decoration-forest-300 underline-offset-2 hover:text-forest-950"
                    >
                      {source.organisation}: {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              {PLANTATION_CAVEAT}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
