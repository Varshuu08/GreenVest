import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Sprout, Info, HandCoins, Droplets, Wind, Check, TriangleAlert, CalendarRange, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useSimulation } from "@/context/SimulationContext";
import { NeedInputCard } from "@/components/engines/StatusBits";
import { AssumptionModal } from "@/components/engines/AssumptionModal";
import { rationaleFor, whyNotThis } from "@/logic/recommend";
import { useToast } from "@/context/ToastContext";
import { persistAnalysis, persistReport } from "@/services/supabaseData";
import { MODEL_ASSUMPTIONS } from "@/data/agronomy";

export default function RecommendationPage() {
  const sim = useSimulation();
  const navigate = useNavigate();
  const toast = useToast();
  const [assump, setAssump] = useState(false);
  const [whyNot, setWhyNot] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  if (!sim.analyzed || !sim.active) return <NeedInputCard />;
  const a = sim.active;
  const others = sim.strategies.filter((s) => s.id !== a.id);
  const m = a.metrics;

  async function generateReport() {
    setGenerating(true);
    let analysisId = sim.analysisId;
    if (!analysisId) {
      const saved = await persistAnalysis(sim.land, sim.strategies, a.id, sim.scenario.name);
      if (saved.source === "unavailable") {
        setGenerating(false);
        toast.push(saved.error || "Unable to save this analysis before generating a report.", "error");
        return;
      }
      analysisId = saved.data.id;
      sim.setAnalysisId(analysisId);
    }
    const report = await persistReport(analysisId, `${a.name} Investment Plan`, {
      land: sim.land,
      strategy: a,
      scenario: sim.scenario.name,
      generatedAt: new Date().toISOString(),
    });
    if (report.source === "unavailable") {
      setGenerating(false);
      toast.push(report.error || "Unable to generate this report. Please try again.", "error");
      return;
    }
    toast.push(report.source === "supabase" ? "Investment report saved" : "Report generated in Demo Mode.", report.source === "supabase" ? "success" : "info");
    setGenerating(false);
    navigate("/report");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeader icon={BadgeCheck} eyebrow="Final answer" title="Recommendation"
        description="An aggregate, explainable decision built from the live metrics on this land." />

      {/* hero recommendation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <GlassCard className="relative overflow-hidden p-7">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-mint-200/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 text-white shadow-lg">
                <Sprout className="h-8 w-8" />
              </span>
              <div>
                <StatusBadge tone="mint" icon={BadgeCheck} dot>Top Modeled Strategy</StatusBadge>
                <h2 className="mt-1 font-display text-3xl font-semibold text-forest-950">{a.code}. {a.name}</h2>
                <p className="text-sm text-slate-500">{a.tagline}</p>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Land", v: `${sim.land.area} ac` }, { l: "Scenario Carbon", v: `${a.carbonBudgetT} tCO₂` },
                { l: "Scenario Finance", v: `${a.returnShort}` }, { l: "Modeled Score", v: `${a.metrics.total}/100` },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/70 px-3 py-2 text-center ring-1 ring-slate-900/5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{s.l}</p>
                  <p className="font-display text-lg font-semibold text-forest-950">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Decision summary: confidence + strengths / risks */}
      {(() => {
        const waterOk = a.waterRequiredUnits <= sim.land.availableWaterUnits * MODEL_ASSUMPTIONS.scoring.outcomeAdjustments.feasibleAvailabilityMultiplier;
        const budgetOk = a.initCostL <= sim.land.budgetLakhs;
        const strengths: string[] = [
          "Reference coverage is available; site-level validation is still required",
          budgetOk ? `Budget feasible under current assumptions · capex within ₹${Math.round(sim.land.budgetLakhs)}L` : null,
          m.carbon >= 80 ? `Strong scenario carbon estimate (${a.carbonBudgetT} tCO₂)` : null,
          waterOk ? "Modeled water requirement is within the selected index" : null,
          m.resilience >= 74 ? "Model shows lower sensitivity under this stress scenario" : null,
        ].filter(Boolean) as string[];

        const risksR: string[] = [];
        if (a.key === "return") risksR.push("Carbon-price sensitivity");
        if (!waterOk) risksR.push("Water pressure under water scarcity");
        risksR.push("Long investment horizon — returns accrue over years");
        if (risksR.length === 0) risksR.push("Market assumptions may drift");

        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <GlassCard className="p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-600"><Sparkles className="h-3.5 w-3.5" /> Input evidence status</p>
              <div className="mt-3 flex flex-wrap items-center gap-5">
                <div className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 px-2 text-center font-display text-xs font-bold uppercase tracking-wide text-white" style={{ width: 76, height: 76 }}>
                  {a.dataConfidence}
                </div>
                <div className="min-w-0 flex-1">
                  {[
                    ["Location evidence", "Not linked", "User-entered location; no parcel-level dataset is connected."],
                    ["Agronomic suitability", "Reference-based", `Species reference coverage: ${a.dataConfidence}.`],
                    ["Carbon and finance", "Scenario estimate", "Internal coefficients over a modeled 10-year horizon."],
                  ].map((r) => {
                    return (
                      <div key={r[0] as string} className="mb-1.5">
                        <div className="flex items-center justify-between gap-3 text-[11px]"><span className="text-slate-500">{r[0]}</span><span className="shrink-0 font-semibold text-forest-800">{r[1]}</span></div>
                        <p className="mt-0.5 leading-snug text-slate-400">{r[2]}</p>
                      </div>
                    );
                  })}
                  <p className="mt-2 text-[11px] leading-snug text-slate-400">Evidence status reflects reference coverage and available inputs; it is not a statistical confidence score.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">Decision at a glance</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-emerald-600">Key strengths</p>
                  {strengths.map((s) => (
                    <p key={s} className="flex items-start gap-1.5 py-1 text-sm text-forest-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{s}</p>
                  ))}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-amber-600">Key risks</p>
                  {risksR.map((s) => (
                    <p key={s} className="flex items-start gap-1.5 py-1 text-sm text-amber-700"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{s}</p>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        );
      })()}

      {/* Illustrative 10-year journey */}
      {(() => {
        const steps = [
          { y: "Year 0", t: "Initial investment", d: "₹" + Math.round(a.initCostL) + "L capex committed" },
          { y: "Years 1–2", t: "Establishment", d: "Planting & early growth" },
          { y: "Years 3–5", t: "Scenario carbon development", d: "Modeled interim carbon estimate ≈ " + Math.round(a.carbonBudgetT * 0.4) + " tCO₂" },
          { y: "Years 6–8", t: "Modeled impact + finance", d: "Illustrative financial scenario ≈ ₹" + Math.round(a.returnL * 0.55) + "L" },
          { y: "Years 9–10", t: "Modeled horizon", d: "Carbon scenario ≈ " + a.carbonBudgetT + " tCO₂ · finance scenario ≈ " + a.returnShort },
        ];
        return (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-forest-600" />
                <h3 className="font-display text-lg font-semibold text-forest-950">Illustrative 10-year investment journey</h3>
              </div>
              <StatusBadge tone="slate">Illustrative projection</StatusBadge>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
              {steps.map((s, i) => (
                <div key={s.y} className="relative">
                  {i < steps.length - 1 && <span className="absolute left-full top-3 hidden h-px w-4 bg-forest-900/15 sm:block" />}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{i === steps.length - 1 ? "🌳" : "🌱"}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-forest-600">{s.y}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-forest-950">{s.t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.d}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11px] text-slate-400">Growth is staged for clarity — actual outcomes depend on site conditions, maintenance and markets. This is not a return guarantee.</p>
          </GlassCard>
        );
      })()}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Why this */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-forest-600" />
            <h3 className="font-display text-lg font-semibold text-forest-950">Why GreenVest recommends this</h3>
          </div>
          <p className="mt-3 leading-relaxed text-slate-600">{rationaleFor(a, sim.land)}</p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat label="Scenario Carbon Score" v={m.carbon} />
            <MiniStat label="Scenario Financial Score" v={m.financial} />
            <MiniStat label="Water Efficiency" v={m.water} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <AnimatedButton onClick={() => void generateReport()} disabled={generating}><HandCoins className="h-4 w-4" /> {generating ? "Generating Plan..." : "Generate Investment Plan"}</AnimatedButton>
            <AnimatedButton variant="ghost" onClick={() => setAssump(true)}><span className="inline-flex items-center gap-2">View Assumptions</span></AnimatedButton>
          </div>
        </GlassCard>

        {/* why not cards */}
        <div className="space-y-4">
          {others.map((o) => (
            <GlassCard key={o.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5"><Droplets className="h-4 w-4" /> Why not {o.code}. {o.name}?</p>
                <Wind className="h-4 w-4 text-slate-300" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">{whyNot === o.id ? whyNotThis(o, sim.land) : whyNotThis(o, sim.land).slice(0, 90) + "…"}</p>
              <button onClick={() => setWhyNot(whyNot === o.id ? null : o.id)} className="mt-2 text-xs font-semibold text-forest-700 hover:underline">
                {whyNot === o.id ? "Show less" : "Full explanation"}
              </button>
            </GlassCard>
          ))}
        </div>
      </div>

      <AssumptionModal open={assump} onClose={() => setAssump(false)} land={sim.land} strat={a} />
    </div>
  );
}

function MiniStat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-xl border border-slate-900/5 bg-forest-50/60 p-3">
      <div className="flex items-center justify-between text-sm"><span className="text-slate-500">{label}</span><span className="font-semibold">{v}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-forest-600 to-mint-400" initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.9 }} />
      </div>
    </div>
  );
}
