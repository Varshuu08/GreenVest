import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trees, Sprout, Leaf, ChevronRight, X, Info, ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSimulation } from "@/context/SimulationContext";
import { NeedInputCard } from "@/components/engines/StatusBits";
import { ScoreBreakdown } from "@/components/engines/ScoreBreakdown";
import { AssumptionModal } from "@/components/engines/AssumptionModal";
import { rationaleFor, whyNotThis } from "@/logic/recommend";
import { easeOut } from "@/lib/variants";
import type { StrategyResult } from "@/logic/types";

const iconMap = { A: Sprout, B: Leaf, C: Trees };

function compData(strategies: StrategyResult[]) {
  return strategies.map((s) => ({
    name: `${s.code} · ${s.name.split(" ")[0]}`,
    "Scenario Carbon": Math.min(100, Math.round((s.carbonBudgetT / 700) * 100)),
    "Scenario Finance": s.metrics.financial,
    "Water Fit": s.metrics.water,
    "Risk Safety": s.metrics.risk,
  }));
}

export default function StrategiesPage() {
  const sim = useSimulation();
  const [showNote, setShowNote] = useState<null | { strat: StrategyResult }>(null);
  const [assump, setAssump] = useState(false);

  if (!sim.analyzed || !sim.active) return <NeedInputCard />;

  const active = sim.active;
  const others = sim.strategies.filter((s) => s.id !== active.id);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeader
        icon={Trees}
        eyebrow="Step 2 — generate"
        title="Plantation Strategies"
        description="Three reference-screened, scenario-model strategies derived from your land inputs. Select one to compare modeled trade-offs and stress-test assumptions."
      />

      {/* selection cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {sim.strategies.map((s, i) => {
          const I = iconMap[s.code];
          const sel = s.id === active.id;
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: easeOut }}
              onClick={() => sim.selectStrategy(s.id)}
              className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                sel ? "border-forest-600 ring-2 ring-forest-600/20 bg-forest-50" : "border-slate-900/5 bg-white hover:-translate-y-1 hover:border-forest-900/15"
              } ${i === 0 && sel ? "" : i === 0 && "bg-white"}`}
            >
              {sel && (
                <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-forest-600 px-2 py-1 text-[10px] font-bold text-white">
                  ACTIVE
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${sel ? "bg-gradient-to-br from-forest-500 to-forest-800 text-white" : "bg-forest-900/5 text-forest-700"}`}>
                  <I className="h-5 w-5" />
                </span>
                <span className="font-display text-lg font-semibold tracking-tight text-forest-950">
                  {s.code}. {s.name}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.tagline}</p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-400">Score <b className="text-forest-900">{s.metrics.total}</b></span>
                <span className="text-slate-400">Scenario carbon <b className="text-forest-900">{s.carbonBudgetT}t</b></span>
                <span className="text-slate-400">Scenario finance <b className="text-forest-900">{s.returnShort}</b></span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900/8">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-forest-500 to-mint-400"
                  style={{ width: `${s.metrics.total}%` }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* active detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: easeOut }}
        >
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-900/5 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">Selected strategy</p>
                <h3 className="font-display text-2xl font-semibold text-forest-950">
                  {active.code}. {active.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone="mint" icon={ChevronRight}>
                  Top modeled match
                </StatusBadge>
              </div>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-3">
              {/* metrics */}
              <GlassCard className="p-5">
                <ScoreBreakdown m={active.metrics} />
              </GlassCard>

              {/* numbers */}
              <div className="space-y-3">
                {[
                  { l: "Initial investment assumption", v: `₹${Math.round(active.initCostL)}L` },
                  { l: "Scenario Carbon Estimate (10yr)", v: `${active.carbonBudgetT} tCO₂` },
                  { l: "Scenario Financial Estimate (10yr)", v: `${active.returnShort}` },
                  { l: "Modeled Water Requirement", v: `${Math.round(active.waterRequiredUnits)} index units` },
                  { l: "Scenario risk sensitivity", v: active.irreRisk },
                  { l: "Modeled Biodiversity Score", v: `${active.metrics.biodiversity}/100` },
                ].map((row) => (
                  <div key={row.l} className="flex items-center justify-between rounded-xl bg-forest-50/60 px-4 py-3 text-sm">
                    <span className="text-slate-500">{row.l}</span>
                    <span className="font-semibold capitalize text-forest-950">{row.v}</span>
                  </div>
                ))}
              </div>

              {/* why + why not */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-forest-600/20 bg-forest-50 p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-forest-800">
                    <Sprout className="h-4 w-4" /> Why this strategy?
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {rationaleFor(active, sim.land)}
                  </p>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Agronomic suitability: reference-based screening · Carbon and finance: scenario estimates · Biodiversity and risk: model scores · Reference coverage: {active.dataConfidence}</p>

                {others.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-amber-500/20 bg-amber-50/70 p-4">
                    <button
                      onClick={() => setShowNote({ strat: o })}
                      className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-amber-700 hover:underline"
                    >
                      <span>Why not {o.code}. {o.name}?</span>
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setAssump(true)}
                  className="mt-1 w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm font-medium text-forest-700 transition-colors hover:bg-forest-50"
                >
                  View Assumptions for {active.name} →
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* comparison chart */}
      <GlassCard className="p-5">
        <div className="mb-1 px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">Side by side</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-forest-950">Strategy comparison</h3>
          <p className="text-sm text-slate-400">Scenario carbon / finance / water fit / risk safety — scaled 0–100</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compData(sim.strategies)} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(12,20,16,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(6,30,20,0.1)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Scenario Carbon" fill="#1f6a41" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Scenario Finance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Water Fit" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Risk Safety" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* header "why-not" dismissible card modal */}
      <AnimatePresence>
        {showNote && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/45" onClick={() => setShowNote(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative max-w-md rounded-3xl border border-slate-900/10 bg-white p-6 shadow-2xl"
            >
              <button onClick={() => setShowNote(null)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Info className="h-6 w-6" />
              </span>
              <h4 className="mt-4 font-display text-xl font-semibold text-forest-950">
                Why not {showNote.strat.code}. {showNote.strat.name}?
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {whyNotThis(showNote.strat, sim.land)}
              </p>
              <button
                onClick={() => {
                  if (sim.recommended) sim.selectStrategy(sim.recommended.id);
                  setShowNote(null);
                }}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
              >
                View the recommended option instead <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AssumptionModal open={assump} onClose={() => setAssump(false)} land={sim.land} strat={active} />
     </div>
  );
}
