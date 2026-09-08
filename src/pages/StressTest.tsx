import { useState } from "react";
import { motion } from "framer-motion";
import { Wind, Droplets, CloudRain, Flame, Waves, TriangleAlert, ShieldCheck, CircleHelp, Sun, Thermometer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CountUp } from "@/components/ui/CountUp";
import { AssumptionModal } from "@/components/engines/AssumptionModal";
import { useSimulation } from "@/context/SimulationContext";
import { NeedInputCard } from "@/components/engines/StatusBits";
import { CLIMATE_SCENARIOS, WORST_CASE } from "@/logic/scenarios";
import { worstCaseVerdict } from "@/logic/recommend";
import { MODEL_ASSUMPTIONS } from "@/data/agronomy";

const iconOf = (n: string) =>
  n === "Normal" ? Sun : n === "Drier Climate" ? CloudRain : n === "Hotter Climate" ? Thermometer : n === "Water Scarcity" ? Droplets : Waves;

export default function StressTestPage() {
  const sim = useSimulation();
  const [assump, setAssump] = useState(false);
  if (!sim.analyzed || !sim.active || !sim.outcome) return <NeedInputCard />;

  const oc = sim.outcome;
  const worstT = Math.max(18, Math.round(sim.active!.metrics.total - 18));
  const verdict = worstCaseVerdict(sim.active!, {
    total: worstT,
    riskLow: sim.active!.metrics.risk > MODEL_ASSUMPTIONS.scoring.recommendation.worstCaseSafetyScore,
    nameOk: sim.active!.name,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeader
        icon={Wind}
        eyebrow="Step 4 — climate lab"
        title="Stress-Test Your Investment"
        description="Apply an illustrative climate and market stress scenario to your selected strategy. Outputs are scenario-model estimates and propagate to the Dashboard and AI Advisor."
      />

      {/* scenario grid */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CLIMATE_SCENARIOS.map((sc) => {
          const Ic = iconOf(sc.name);
          const act = !sim.worseOn && sim.scenario.name === sc.name;
          return (
            <motion.button
              key={sc.name}
              whileHover={{ y: -2 }}
              onClick={() => sim.setScenario(sc.name)}
              className={`rounded-2xl border p-4 text-left transition-all ${act ? "border-forest-600 bg-forest-50 ring-2 ring-forest-600/20" : "border-slate-900/5 bg-white hover:border-forest-900/20"}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${act ? "bg-forest-600 text-white" : "bg-forest-900/5 text-forest-600"}`}>
                <Ic className="h-5 w-5" />
              </span>
              <p className={`mt-2 font-semibold ${act ? "text-forest-800" : "text-forest-950"}`}>{sc.name}</p>
              <p className="text-[11px] text-slate-400">Illustrative stress intensity</p>
            </motion.button>
          );
        })}
      </div>

      {/* outcome strip */}
      <div key={sim.scenario.name + String(sim.worseOn)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { l: "Scenario Carbon Estimate", v: oc.carbonT, suf: " tCO₂", color: "text-forest-700", foot: "modeled 10-year scenario" },
          { l: "Scenario Financial Estimate", pre: "₹", v: oc.returnL, suf: "L", color: "text-amber-600", foot: "modeled 10-year scenario" },
          { l: "Modeled Water Requirement", v: oc.reqWater, suf: " index", color: "text-sky-600", foot: `availability index ${oc.availWater}` },
          { l: "Scenario Risk Sensitivity", v: riskNum(oc.riskLevel), suf: "/100", color: "text-rose-600", foot: oc.riskLevel },
          { l: "GreenVest Score", v: oc.total, suf: "/100", color: "text-forest-900", foot: "total" },
        ].map((s) => (
          <GlassCard key={s.l} className="p-4">
            <p className="text-xs text-slate-500">{s.l}</p>
            <p className={`mt-1 font-display text-3xl font-semibold tabular-nums ${s.color}`}>
              {s.pre}
              <CountUp value={s.v} />
              <span className="ml-0.5 text-base text-slate-400">{s.suf}</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{s.foot}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* water budget */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-sky-500" />
            <h3 className="font-display text-lg font-semibold text-forest-950">Modeled Water Balance</h3>
          </div>
          <WaterGauge avail={oc.availWater} req={oc.reqWater} />
          {oc.feasible ? (
            <StatusBadge tone="emerald" icon={ShieldCheck}>
              Within modeled availability index
            </StatusBadge>
          ) : (
            <StatusBadge tone="amber" icon={TriangleAlert}>
              WATER CONSTRAINT — trim high-water area or switch strategy
            </StatusBadge>
          )}
        </GlassCard>

        {/* worst case */}
        <GlassCard className={`p-6 ${sim.worseOn ? "border-rose-300 bg-rose-50/40" : ""}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-rose-500" />
              <h3 className="font-display text-lg font-semibold text-forest-950">Worst-Case Stress Test</h3>
            </span>
            <button onClick={() => sim.setWorstCase(!sim.worseOn)} className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${sim.worseOn ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {sim.worseOn ? "Applied" : "Run test"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Illustrative assumptions: rainfall −{Math.round((1 - WORST_CASE.rainMul) * 100)}% · water index −{Math.round((1 - WORST_CASE.waterAvailMul) * 100)}% · financial carbon-price factor −{Math.round((1 - WORST_CASE.carbonPriceMul) * 100)}% · maintenance assumption +{Math.round((WORST_CASE.maintHike - 1) * 100)}%
          </p>
          {sim.worseOn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 ${oc.feasible ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-rose-50 ring-1 ring-rose-200"} rounded-2xl p-4`}
            >
              <p className={`font-display text-xl font-bold ${oc.feasible ? "text-emerald-700" : "text-rose-700"}`}>
                {verdict.verdict}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{verdict.text}</p>
              {verdict.pivot && !oc.feasible ? (
                <p className="mt-2 text-sm text-forest-800">{verdict.pivot}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">{oc.note}</p>
              )}
            </motion.div>
          )}
        </GlassCard>
      </div>

      <button
        onClick={() => setAssump(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:underline"
      >
        <CircleHelp className="h-4 w-4" />
        View scenario assumptions
      </button>

      <AssumptionModal open={assump} onClose={() => setAssump(false)} land={sim.land} strat={sim.active} />
    </div>
  );
}

function riskNum(r: string) {
  return r === "low" ? 12 : r === "low-medium" ? 25 : r === "medium" ? 42 : r === "medium-high" ? 60 : 78;
}

function WaterGauge({ avail, req }: { avail: number; req: number }) {
  const over = req > avail;
  const pct = Math.min(100, Math.round((req / Math.max(avail, 1)) * 100));
  return (
    <div className="my-4">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-500">Modeled requirement</span>
        <span className="font-semibold text-forest-900">{req} index units</span>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-slate-200/80">
        <motion.div
          className={`flex h-full items-center justify-center rounded-full text-[10px] font-bold text-white ${over ? "bg-rose-500" : "bg-sky-500"}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {over ? "EXCEEDS" : ""}
        </motion.div>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-slate-500">Modeled availability</span>
        <span className="font-semibold text-forest-900">{avail} index units</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-forest-900/10">
        <motion.div className="h-full bg-emerald-400" animate={{ width: `${Math.min(100, (avail / avail) * 100)}%` }} />
      </div>
    </div>
  );
}
