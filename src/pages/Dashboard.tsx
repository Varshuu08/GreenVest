import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Trees, Coins, Gauge, ArrowRight, Sprout, ScanSearch, Droplets, Save, History } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { loadAnalyses, persistAnalysis } from "@/services/supabaseData";
import type { SavedAnalysis } from "@/lib/repo";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { easeOut } from "@/lib/variants";
import { useSimulation } from "@/context/SimulationContext";
import { ScoreBreakdown } from "@/components/engines/ScoreBreakdown";
import { NeedInputCard } from "@/components/engines/StatusBits";

function projectionCurve(carbonT: number, returnL: number) {
  // monotone cumulative proxy used for the long-term outlook area chart
  const ptsVals = [0.08, 0.22, 0.4, 0.62, 0.86, 1];
  return ptsVals.map((f, i) => ({
    year: i === 5 ? "10yr" : `Y${i * 2 + 2}`,
    Carbon: Math.round(carbonT * f),
    Return: +((returnL * f) / 10).toFixed(1),
  }));
}

export default function DashboardPage() {
  const sim = useSimulation();
  const toast = useToast();
  const active = sim.active;
  const outcome = sim.outcome;
  const [recent, setRecent] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    void loadAnalyses().then((result) => {
      setRecent(result.data.slice(0, 3));
      if (result.source === "unavailable") toast.push(result.error || "Unable to load recent analyses.", "error");
    });
  }, [toast]);

  async function handleSave() {
    if (!active) return;
    const saved = await persistAnalysis(sim.land, sim.strategies, active.id, sim.scenario.name);
    if (saved.source === "unavailable") {
      toast.push(saved.error || "Unable to save your analysis. Please try again.", "error");
      return;
    }
    sim.setAnalysisId(saved.data.id);
    setRecent((items) => [saved.data, ...items.filter((item) => item.id !== saved.data.id)].slice(0, 3));
    toast.push(saved.source === "supabase" ? "Analysis saved" : "Analysis saved in Demo Mode.", saved.source === "supabase" ? "success" : "info");
  }

  if (!sim.analyzed || !active || !outcome) {
    return <NeedInputCard />;
  }

  const data = projectionCurve(outcome ? outcome.carbonT : active.carbonBudgetT, active.returnL);
  const curCarbon = outcome ? outcome.carbonT : active.carbonBudgetT;
  const curReturn = outcome ? outcome.returnL : active.returnL;
  const total = outcome ? outcome.total : active.metrics.total;
  const resiliencePct = outcome ? outcome.resiliencePct : active.metrics.resilience;
  const riskLevel = outcome ? outcome.riskLevel : active.irreRisk;

  const cards = [
    { label: "Land Area", v: sim.land.area, suffix: "acres", icon: MapPin, hint: "Registered plot", tone: "bg-emerald-100 text-emerald-600" },
    { label: "Scenario Carbon Estimate", v: curCarbon, suffix: "tCO₂", icon: Trees, hint: `${sim.scenario.name} modeled scenario`, tone: "bg-forest-900/5 text-forest-700" },
    { label: "Scenario Financial Estimate", pre: "₹", v: curReturn, suffix: "L", icon: Coins, hint: "Modeled 12-year scenario", tone: "bg-amber-100 text-amber-600" },
    { label: "GreenVest Score", v: total, suffix: "/100", icon: Gauge, hint: "Overall viability", tone: "bg-mint-100 text-forest-700" },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        icon={MapPin}
        eyebrow={`${sim.land.location} · ${sim.land.area} acres`}
        title="Good afternoon 👋"
        description={
          <>
            Scenario <b className="text-forest-800">{outcome.name}</b> is live — sync your numbers across Stress Test, Simulator and the AI Advisor.
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-xl bg-forest-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-800">
            <Save className="h-4 w-4" /> Save Analysis
          </button>
          <Link to="/analyses" className="inline-flex items-center gap-1.5 rounded-xl border border-forest-900/10 bg-white px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50">
            <History className="h-4 w-4" /> My Analyses
          </Link>
          <Link to="/simulator" className="inline-flex items-center gap-1.5 rounded-xl bg-forest-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-800">
            <ScanSearch className="h-4 w-4" /> Open Simulator
          </Link>
        </div>
      </PageHeader>

      {/* metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <GlassCard
            key={c.label}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.07, ease: easeOut }}
            className="p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{c.label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.tone}`}>
                <c.icon className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-forest-950 tabular-nums">
              {c.pre}{c.v}
              <span className="ml-1 text-base font-medium text-slate-400">{c.suffix}</span>
            </p>
            <p className="mt-2 text-xs text-slate-400">{c.hint}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* active strategy */}
        <GlassCard className="relative overflow-hidden p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <StatusBadge tone="mint" icon={MapPin} dot>
              {active.code}. {active.name} · Modeled
            </StatusBadge>
          </div>
          <span className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 text-white">
            <Sprout className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-display text-2xl font-semibold text-forest-950">{active.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{active.tagline}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-forest-50/70 p-3">
              <p className="text-xs text-slate-400">Scenario carbon</p>
              <p className="font-display text-2xl font-semibold text-forest-900">{curCarbon} t</p>
            </div>
            <div className="rounded-xl bg-forest-50/70 p-3">
              <p className="text-xs text-slate-400">Risk sensitivity</p>
              <p className="font-display text-2xl font-semibold text-forest-900 capitalize">{riskLevel}</p>
            </div>
          </div>

          <Link to="/strategies" className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700">
            Compare all three
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </GlassCard>

        {/* chart */}
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">Long-term outlook</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-forest-950">Modeled Financial vs Carbon Scenario</h3>
            </div>
            <StatusBadge tone="slate">{sim.scenario.name}</StatusBadge>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f6a41" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#1f6a41" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(12,20,16,0.06)" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={42} />
                <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(6,30,20,0.1)", fontSize: 12 }} />
                <Area dataKey="Carbon" type="monotone" stroke="#1f6a41" strokeWidth={2.5} fill="url(#gf)" animationDuration={900} />
                <Area dataKey="Return" type="monotone" stroke="#d97706" strokeWidth={2.5} strokeDasharray="2 4" fill="url(#cf)" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* resilience + breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="flex flex-col justify-between gap-4 p-6">
          <ScoreBreakdown m={active.metrics} />
        </GlassCard>

        <GlassCard className="col-span-1 flex flex-col justify-between gap-4 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">Modeled Climate Resilience</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-forest-950">
                Resilience under “{outcome.name}” scenario assumption
              </h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-xl bg-mint-100 px-3 py-1.5 text-sm font-bold text-forest-800">
              <Droplets className="h-4 w-4" />
              {resiliencePct}/100
            </span>
          </div>
          <RingCore value={resiliencePct} sub={`${sim.land.area} acres · ${active.name}`} />
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">Saved workspace</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-forest-950">Recent Analyses</h3>
          </div>
          <Link to="/analyses" className="text-sm font-semibold text-forest-700 hover:underline">View all</Link>
        </div>
        {recent.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recent.map((analysis) => (
              <Link key={analysis.id} to="/analyses" className="rounded-xl border border-slate-900/5 bg-forest-50/50 p-4 transition-colors hover:bg-forest-50">
                <p className="font-semibold text-forest-950">{analysis.land.location}</p>
                <p className="mt-1 text-xs text-slate-500">{analysis.land.area} acres · {analysis.recommendedName}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-display font-semibold text-forest-800">{analysis.score}/100</span>
                  <span className="text-slate-400">{new Date(analysis.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Your saved cloud analyses will appear here after you save this plan.</p>
        )}
      </GlassCard>
    </div>
  );

  function RingCore({ value, sub }: { value: number; sub: string }) {
    const R = 78;
    const c = 2 * Math.PI * R;
    return (
      <div className="flex items-center justify-center">
        <svg width="190" height="190" className="-rotate-90">
          <circle cx="95" cy="95" r={R} fill="none" stroke="rgba(14,60,40,0.08)" strokeWidth="13" />
          <motion.circle
            cx="95"
            cy="95"
            r={R}
            fill="none"
            stroke="url(#gres)"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - value / 100) }}
            transition={{ duration: 1.3, ease: easeOut }}
          />
          <defs>
            <linearGradient id="gres" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1fb782" />
              <stop offset="100%" stopColor="#1f6a41" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center text-center">
          <span className="font-display text-4xl font-semibold text-forest-950 tabular-nums">{value}</span>
          <span className="text-xs text-slate-400">{sub}</span>
        </div>
      </div>
    );
  }
}
