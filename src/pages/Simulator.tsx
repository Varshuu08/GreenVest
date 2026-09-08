import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Save, Leaf, Coins, Droplets, RefreshCw } from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { CountUp } from "@/components/ui/CountUp";
import { useSimulation } from "@/context/SimulationContext";
import { NeedInputCard } from "@/components/engines/StatusBits";
import { scoreStrategy } from "@/logic/engine";
import { useToast } from "@/context/ToastContext";
import { loadScenarios, persistAnalysis, persistScenario } from "@/services/supabaseData";
import type { SavedScenario } from "@/services/supabaseData";
import { MODEL_ASSUMPTIONS } from "@/data/agronomy";

interface Ctl { budget: number; rain: number; water: number; carbonPrice: number; carbonPrio: number; returnPrio: number; }

const simulatorAssumptions = MODEL_ASSUMPTIONS.simulator;
const INIT: Ctl = { budget: simulatorAssumptions.baselineBudgetLakhs, rain: 0, water: 0, carbonPrice: simulatorAssumptions.baselineCarbonPrice, carbonPrio: 50, returnPrio: 50 };

export default function SimulatorPage() {
  const sim = useSimulation();
  const toast = useToast();
  const [c, setC] = useState<Ctl>(INIT);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [name, setName] = useState("Drought baseline");

  const active = sim.active;

  useEffect(() => {
    if (!sim.analysisId) {
      setSaved([]);
      return;
    }
    void loadScenarios(sim.analysisId).then((result) => {
      setSaved(result.data);
      if (result.source === "unavailable") toast.push(result.error || "Unable to load saved scenarios.", "error");
    });
  }, [sim.analysisId, toast]);

  const out = useMemo(() => {
    if (!active) return null;
    const budgetMul = c.budget / simulatorAssumptions.baselineBudgetLakhs;
    const rainAdj = 1 + c.rain / 100;
    const carbonPriceAdj = c.carbonPrice / simulatorAssumptions.baselineCarbonPrice;
    const returnNudge = 1 + (c.returnPrio - c.carbonPrio) / simulatorAssumptions.prioritySpreadScale;

    // Price changes affect the financial scenario only; they do not alter the
    // modeled carbon quantity for the same planting mix.
    const priorityTotal = Math.max(1, c.returnPrio + c.carbonPrio);
    let carbon = active.carbonBudgetT * budgetMul * rainAdj * simulatorAssumptions.carbonBaselineAdjustment;
    let ret = active.returnL * budgetMul * (c.returnPrio / priorityTotal) * returnNudge * (simulatorAssumptions.financialWaterBase + c.water / simulatorAssumptions.financialWaterScale) * carbonPriceAdj;
    carbon = Math.max(simulatorAssumptions.minimumCarbonEstimate, Math.round(carbon));
    ret = Math.max(simulatorAssumptions.minimumFinancialEstimate, Math.round(ret));
    const reqWater = Math.round(active.waterRequiredUnits * (1 - (c.water) / simulatorAssumptions.waterRequirementReductionScale));
    const metrics = scoreStrategy(carbon, ret, reqWater, sim.land.availableWaterUnits, MODEL_ASSUMPTIONS.zoning.fertilityScenarioInput, active.biodiversity, active.metrics.risk - c.water * simulatorAssumptions.riskWaterSensitivity, sim.land.goal);
    return { carbon, ret, reqWater, avail: sim.land.availableWaterUnits, metrics };
  }, [c, active, sim.land]);

  if (!sim.analyzed || !active || !out) return <NeedInputCard />;

  const curve = [0.05, 0.15, 0.3, 0.5, 0.74, 1].map((f, i) => ({
    y: i * 2, Carbon: Math.round(out.carbon * f), Return: +((out.ret * f) / 10).toFixed(1),
  }));

  async function addSaved() {
    if (!active || !out) return;
    let analysisId = sim.analysisId;
    if (!analysisId) {
      const savedAnalysis = await persistAnalysis(sim.land, sim.strategies, active.id, sim.scenario.name);
      if (savedAnalysis.source === "unavailable") {
        toast.push(savedAnalysis.error || "Unable to save this analysis before saving a scenario.", "error");
        return;
      }
      analysisId = savedAnalysis.data.id;
      sim.setAnalysisId(analysisId);
    }
    const result = await persistScenario(analysisId, {
      name: name.trim() || "Untitled scenario",
      ...c,
      carbon: out.carbon,
      returnL: out.ret,
      risk: 100 - out.metrics.risk,
      resilience: out.metrics.resilience,
      score: out.metrics.total,
    });
    if (result.source === "unavailable") {
      toast.push(result.error || "Unable to save this scenario. Please try again.", "error");
      return;
    }
    setSaved((items) => [result.data, ...items.filter((item) => item.id !== result.data.id)].slice(0, 8));
    toast.push(result.source === "supabase" ? "Scenario saved" : "Scenario saved in Demo Mode.", result.source === "supabase" ? "success" : "info");
  }
  function load(savedScenario: SavedScenario) {
    setC({
      budget: savedScenario.budget,
      rain: savedScenario.rain,
      water: savedScenario.water,
      carbonPrice: savedScenario.carbonPrice,
      carbonPrio: savedScenario.carbonPrio,
      returnPrio: savedScenario.returnPrio,
    });
    toast.push(`Restored ${savedScenario.name}`, "info");
  }
  const resetNameish = name;

  const Sl = ({ label, val, min, max, step, onChange, suf }: { label: string; val: number; min: number; max: number; step: number; onChange: (v: number) => void; suf: string }) => (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold tabular-nums text-forest-900">{val}{suf}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-forest-600" />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeader icon={FlaskConical} eyebrow="What-if lab" title="Scenario Simulator"
        description="Adjust illustrative scenario inputs for budget, rainfall, water and priorities. The internal model responds instantly; it is not a site-specific forecast." />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* controls */}
        <GlassCard className="space-y-5 p-6 lg:col-span-2">
          <Sl label="Scenario investment budget" val={c.budget} min={10} max={30} step={1} suf="L" onChange={(v) => setC({ ...c, budget: v })} />
          <Sl label="Rainfall change assumption" val={c.rain} min={-30} max={20} step={5} suf="%" onChange={(v) => setC({ ...c, rain: v })} />
          <Sl label="Water availability index" val={c.water} min={0} max={100} step={5} suf="%" onChange={(v) => setC({ ...c, water: v })} />
          <Sl label="Carbon-price scenario" val={c.carbonPrice} min={500} max={1500} step={100} suf="/t" onChange={(v) => setC({ ...c, carbonPrice: v })} />
          <Sl label="Carbon priority" val={c.carbonPrio} min={0} max={100} step={5} suf="" onChange={(v) => setC({ ...c, carbonPrio: v, returnPrio: 100 - v })} />
          <Sl label="Return priority" val={c.returnPrio} min={0} max={100} step={5} suf="" onChange={(v) => setC({ ...c, returnPrio: v, carbonPrio: 100 - v })} />

          <div className="flex gap-2 border-t border-slate-900/5 pt-4">
            <input value={resetNameish} onChange={(e) => setName(e.target.value)} placeholder="Scenario name" className="input" />
            <AnimatedButton variant="secondary" className="shrink-0" onClick={() => void addSaved()} type="button">
              <Save className="h-4 w-4" /> Save
            </AnimatedButton>
          </div>
          {/* saved list */}
          {saved.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">Saved scenarios</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {saved.map((s, i) => (
                  <button key={s.id} onClick={() => load(s)} className="rounded-full border border-forest-900/10 bg-forest-50 px-3 py-1 text-xs text-forest-800 hover:bg-forest-100">
                    {i + 1}. {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setC(INIT)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-600 hover:underline">
            <RefreshCw className="h-3.5 w-3.5" /> Reset controls
          </button>
        </GlassCard>

        {/* live results */}
        <div className="space-y-4 lg:col-span-3">
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-900/5 text-forest-600"><Leaf className="h-4 w-4" /></span>
              <p className="mt-2 text-xs text-slate-400">Scenario Carbon Estimate</p>
              <p className="font-display text-2xl font-semibold text-forest-900 tabular-nums"><CountUp value={out.carbon} /> t</p>
            </GlassCard>
            <GlassCard className="p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><Coins className="h-4 w-4" /></span>
              <p className="mt-2 text-xs text-slate-400">Scenario Financial Estimate</p>
              <p className="font-display text-2xl font-semibold text-forest-900 tabular-nums">₹<CountUp value={out.ret} />L</p>
            </GlassCard>
            <GlassCard className="p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600"><Droplets className="h-4 w-4" /></span>
              <p className="mt-2 text-xs text-slate-400">Modeled Water Requirement</p>
              <p className="font-display text-2xl font-semibold text-forest-900 tabular-nums"><CountUp value={out.reqWater} /></p>
            </GlassCard>
          </div>

          <GlassCard className="p-5">
            <div className="flex items-center justify-between px-1">
            <h4 className="font-display text-lg font-semibold text-forest-950">Illustrative sensitivity outlook</h4>
              <span className="text-sm font-bold text-forest-800">{out.metrics.total}/100</span>
            </div>
            <div className="mt-2 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1f6a41" stopOpacity={0.4} /><stop offset="100%" stopColor="#1f6a41" stopOpacity={0.02} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(12,20,16,0.06)" />
                  <XAxis dataKey="y" tickFormatter={(v) => `Y${v}`} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(6,30,20,0.1)", fontSize: 12 }} />
                  <Area dataKey="Carbon" type="monotone" stroke="#1f6a41" strokeWidth={2.5} fill="url(#cg)" animationDuration={500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <WaterBudgetBar req={out.reqWater} avail={out.avail} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function WaterBudgetBar({ req, avail }: { req: number; avail: number }) {
  const over = req > avail;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm"><span className="text-slate-500">Modeled availability index</span><span className="font-semibold text-forest-900">{avail} index units</span></div>
      <div className="h-5 overflow-hidden rounded-full bg-slate-200/80">
        <motion.div className="flex h-full items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white" animate={{ width: "100%" }} />
      </div>
      <div className="mt-3 mb-1 flex items-center justify-between text-sm"><span className="text-slate-500">Modeled water requirement</span><span className={`font-semibold ${over ? "text-rose-600" : "text-forest-900"}`}>{req} index units {over && "⚠ exceeds"}</span></div>
      <div className="flex h-5 overflow-hidden rounded-full bg-slate-200/80">
        <motion.div className={`h-full rounded-full ${over ? "bg-rose-500" : "bg-sky-500"}`} animate={{ width: `${Math.min(100, (req / Math.max(avail, 1)) * 100)}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{over ? "The scenario model flags a water constraint. Consider a lower-demand mix, moisture-conservation practices and local water planning." : "Within the current modeled availability index; validate actual irrigation demand on site."}</p>
    </div>
  );
}
