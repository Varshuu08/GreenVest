import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Map, TreePine, Coins, Droplets } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSimulation } from "@/context/SimulationContext";
import { NeedInputCard } from "@/components/engines/StatusBits";
import { defaultZoning } from "@/logic/zoning";
import type { ZoningAllocation } from "@/logic/types";
import { persistZoning } from "@/services/supabaseData";
import { useToast } from "@/context/ToastContext";

const ZONES: { key: keyof ZoningAllocation; label: string; from: string; to: string }[] = [
  { key: "carbon", label: "Carbon Forest", from: "#0d3724", to: "#2f8f5b" },
  { key: "income", label: "Income Plantation", from: "#b45309", to: "#f59e0b" },
  { key: "biodiversity", label: "Biodiversity Belt", from: "#15803d", to: "#34d399" },
  { key: "conservation", label: "Conservation", from: "#0f766e", to: "#5eead4" },
];

export default function ZoningPage() {
  const sim = useSimulation();
  const toast = useToast();
  const skipInitialPersist = useRef(true);

  useEffect(() => {
    if (!sim.analysisId) {
      skipInitialPersist.current = true;
      return;
    }
    if (skipInitialPersist.current) {
      skipInitialPersist.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      void persistZoning(sim.analysisId!, sim.zoning, sim.land, sim.scenario.name).then((result) => {
        if (result.source === "unavailable") toast.push(result.error || "Unable to save zoning changes. Please try again.", "error");
      });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [sim.analysisId, sim.land, sim.scenario.name, sim.zoning, toast]);

  if (!sim.analyzed || !sim.active || !sim.zoningResult) return <NeedInputCard />;
  const z = sim.zoning;
  const res = sim.zoningResult;

  function set(key: keyof ZoningAllocation, val: number) {
    const v = Math.max(0, Math.min(100, Math.round(val)));
    const others = ZONES.map((x) => x.key).filter((k) => k !== key);
    const totalOthers = others.reduce((s, k) => s + z[k], 0);
    let shrink = (totalOthers + v) - 100;
    shrink = Math.max(0, shrink);
    const n = { ...z, [key]: v };
    for (const k of others) {
      if (shrink <= 0) break;
      const take = Math.min(n[k], Math.ceil(shrink));
      n[k] -= take;
      shrink -= take;
    }
    const leftover = 100 - (Object.values(n) as number[]).reduce((a, b) => a + b, 0);
    if (leftover > 0) n.conservation += leftover;
    sim.setZoning({ carbon: n.carbon, income: n.income, biodiversity: n.biodiversity, conservation: n.conservation });
  }

  const sum = z.carbon + z.income + z.biodiversity + z.conservation;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeader icon={Map} eyebrow="Step 5 — optimise" title="Land Zoning Optimizer"
        description="Compare illustrative land-allocation scenarios across carbon, finance, biodiversity and conservation. The total always equals 100%; validate the field layout locally." />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-forest-950">Allocation</h3>
            <span className={`rounded-lg px-2 py-1 text-sm font-bold ${sum === 100 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
              {sum}%
            </span>
          </div>
          <div className="mt-5 space-y-6">
            {ZONES.map((zo) => (
              <div key={zo.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: zo.from }} /> {zo.label}
                  </span>
                  <span className="font-semibold text-forest-900">{z[zo.key]}%</span>
                </div>
                <input type="range" min={0} max={100} value={z[zo.key]} onChange={(e) => set(zo.key, Number(e.target.value))} className="w-full accent-forest-700" />
              </div>
            ))}
          </div>
          <button onClick={() => sim.setZoning({ ...defaultZoning })} className="mt-5 text-xs font-semibold text-forest-600 underline-offset-2 hover:underline">
            Reset to 50 / 30 / 10 / 10
          </button>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-forest-950">Zoning map</h3>
              <StatusBadge tone={res.feasible ? "emerald" : "amber"}>
                {res.feasible ? "Within modeled water index" : "Modeled water stress"}
              </StatusBadge>
            </div>
            <div className="mt-5 flex aspect-[4/3] w-full flex-col overflow-hidden rounded-2xl border border-slate-900/5">
              {ZONES.map((zo) => (
                <motion.div
                  key={zo.key}
                  className="flex min-h-[6px] items-center justify-center overflow-hidden whitespace-nowrap text-[11px] font-semibold text-white/95"
                  style={{ background: `linear-gradient(135deg, ${zo.from}, ${zo.to})` }}
                  animate={{ height: `${z[zo.key]}%` }}
                  initial={false}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {z[zo.key] > 7 && `${zo.label} ${z[zo.key]}%`}
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={TreePine} l="Scenario Carbon" v={`${res.carbonBudget} tCO₂`} />
            <Metric icon={Coins} l="Scenario Finance" v={`₹${res.returnL}L`} />
            <Metric icon={Droplets} l="Modeled Water" v={`${res.reqWater} idx`} />
            <Metric icon={Map} l="Modeled Score" v={`${res.metrics.total}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Ic, l, v }: { icon: React.ElementType; l: string; v: string }) {
  return (
    <GlassCard className="flex items-center gap-3 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-900/5 text-forest-600"><Ic className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-slate-400">{l}</p>
        <p className="truncate font-display text-base font-semibold text-forest-900">{v}</p>
      </div>
    </GlassCard>
  );
}
