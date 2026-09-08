import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ChevronRight, Play, Pause, RotateCcw, SkipForward,
  Gauge, Coins, Trees, Wind, Landmark, CircleDot, Sparkles, Leaf,
} from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import { demoLand, demoStrategy } from "@/data/demo";

type Phase = {
  id: string; title: string; body: string; Visual: () => ReactNode;
};

function ValueGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map(([k, v]) => (
        <div key={k} className="rounded-xl bg-white/5 px-3 py-2 text-left">
          <p className="text-[10px] uppercase tracking-wide text-forest-300">{k}</p>
          <p className="font-display text-sm font-semibold text-white">{v}</p>
        </div>
      ))}
    </div>
  );
}

function MetricK({ v, l, Icon, ac }: { v: number; l: string; Icon: typeof Trees; ac?: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 text-left ring-1 ring-white/10">
      <Icon className="mb-2 h-5 w-5 text-mint-300" />
      <p className={`font-display text-3xl font-semibold ${ac ?? "text-white"}`}>
        {l.includes("Finance") && "₹"}<CountUp value={v} />
        {l.includes("Carbon") && " tCO₂"}
        {l.includes("Finance") && "L"}
      </p>
      <p className="text-[11px] text-forest-300">{l}</p>
    </div>
  );
}

export default function GuidedDemo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const phases: Phase[] = useMemo(() => [
    {
      id: "land",
      title: "Understanding your land",
      body: `${demoLand.location} · ${demoLand.areaAcres} acres · ${demoLand.soilType} · ${demoLand.rainfall} · ${demoLand.waterAvailability} · ${demoLand.budgetShort} budget · Balanced goal.`,
      Visual: () => (
        <ValueGrid rows={[
          ["Location", demoLand.location], ["Area", `${demoLand.areaAcres} acres`],
          ["Soil", demoLand.soilType], ["Rain", demoLand.rainfall],
          ["Water", demoLand.waterAvailability], ["Budget", demoLand.budgetShort],
        ]} />
      ),
    },
    {
      id: "analysis",
      title: "Analyzing land suitability",
      body: "GreenVest combines reference-based soil, rainfall and drainage screening with transparent water, budget and performance scenario assumptions.",
      Visual: () => <ValueGrid rows={[["Soil screen", "Reference-based"], ["Rainfall input", "Representative scenario"], ["Water screen", "Modeled index"], ["Budget screen", "₹15L scenario"]]} />,
    },
    {
      id: "strategies",
      title: "Generating plantation strategies",
      body: "Three strategies compared on scenario carbon, scenario finance, water fit and risk sensitivity.",
      Visual: () => (
        <div className="space-y-2">
          {[{ n: "A. Carbon Forest", s: 91, c: "719t" }, { n: "B. Balanced Agroforestry", s: 87, c: "612t" }, { n: "C. High-Value Plantation", s: 76, c: "390t" }].map((x) => (
            <div key={x.n} className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <div className="flex items-center justify-between text-sm"><span className="text-white">{x.n}</span><span className="text-mint-300">Scenario {x.c}</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-forest-400 to-mint-300" initial={{ width: 0 }} animate={{ width: `${x.s}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "decision",
      title: "GreenVest Recommendation",
      body: `${demoStrategy.name} leads with a GreenVest Score of ${demoStrategy.score}/100.`,
      Visual: () => (
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-400 to-forest-700 text-2xl"><CircleDot className="text-white" /></span>
          <MetricK v={demoStrategy.score} l="Score /100" Icon={Gauge} ac="text-mint-200" />
        </div>
      ),
    },
    {
      id: "stress",
      title: "But what if the climate changes?",
      body: "An illustrative lower-rainfall input (100% → 80%) is applied. The scenario model recalculates.",
      Visual: () => (
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 text-left">
          <div className="flex items-center justify-between text-sm"><span className="text-forest-300">Rainfall</span><span className="font-semibold text-white">100% → 80%</span></div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-sky-300" initial={{ width: "100%" }} animate={{ width: "80%" }} transition={{ duration: 1.1 }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MetricK v={540} l="Scenario Carbon" Icon={Trees} ac="text-rose-300" />
            <MetricK v={25} l="Scenario Finance" Icon={Coins} ac="text-amber-200" />
            <MetricK v={12} l="Risk+ pts" Icon={Wind} ac="text-white" />
          </div>
        </div>
      ),
    },
    {
      id: "viable",
      title: "The GreenVest Stress Test",
      body: "Under this illustrative rainfall-reduction assumption, the scenario model keeps the recommended strategy above its viability threshold.",
      Visual: () => (
        <div className="rounded-2xl bg-emerald-500/10 p-4 text-left ring-1 ring-emerald-400/30">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200"><Sparkles className="h-4 w-4" /> Strategy still viable</p>
          <p className="mt-1 text-xs text-emerald-100/80">Balanced Agroforestry remains within the model threshold at a scenario score of ~84/100.</p>
        </div>
      ),
    },
    {
      id: "budget",
      title: "What if you invest more?",
      body: "Raising the scenario budget ₹15L → ₹20L lets the model test a less constrained planting mix. Actual costs require local quotations.",
      Visual: () => (
        <div className="grid grid-cols-2 gap-2">
          <MetricK v={612} l="Scenario Carbon" Icon={Trees} />
          <MetricK v={28} l="Scenario Finance" Icon={Coins} />
          <div className="rounded-2xl bg-white/5 p-3 text-left ring-1 ring-white/10"><p className="text-[11px] text-forest-300">Feasibility</p><p className="text-emerald-200">High</p></div>
          <div className="rounded-2xl bg-white/5 p-3 text-left ring-1 ring-white/10"><p className="text-[11px] text-forest-300">Land allocation</p><p className="text-white">Re-optimized</p></div>
        </div>
      ),
    },
    {
      id: "why-not",
      title: "Why not Strategy C?",
      body: "Strategy C is not the preferred model outcome because its modeled water requirement can press on the selected limited-water index and its scenario risk sensitivity is higher.",
      Visual: () => (
        <div className="rounded-2xl bg-amber-500/10 p-4 text-left ring-1 ring-amber-400/30 text-sm text-amber-100/90">
          The financial scenario is stronger, but the modeled water fit and risk sensitivity are weaker for this land input and goal.
        </div>
      ),
    },
    {
      id: "final",
      title: `Your decision — GreenVest Score ${demoStrategy.score}/100`,
      body: "Balanced Agroforestry remains the highest-ranked scenario under these input and assumption settings.",
      Visual: () => (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-forest-400 to-forest-700 font-display text-3xl font-semibold text-white">
              <CountUp value={demoStrategy.score} />
            </div>
            <MetricK v={612} l="Scenario Carbon" Icon={Trees} />
            <MetricK v={28} l="Scenario Finance" Icon={Coins} />
          </div>
        </div>
      ),
    },
  ], []);

  const CHIP = ["Land", "Analysis", "Strategies", "Decision", "Stress", "Verdict", "Budget", "Why Not", "Final"];

  function go(i: number) {
    setStep(Math.max(0, Math.min(phases.length - 1, i)));
  }
  function next() {
    if (step < phases.length - 1) go(step + 1); else setPaused(true);
  }

  useEffect(() => {
    if (!open) return;
    if (paused) return;
    timer.current = window.setTimeout(() => {
      if (step < phases.length - 1) setStep((s) => s + 1);
      else setPaused(true);
    }, 4200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [open, paused, step, phases.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") next(); if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const p = phases[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[120]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#052419] via-[#0b3b26] to-[#061e14]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-forest-500/20 blur-3xl" />
            <div className="absolute left-10 bottom-10 h-72 w-72 rounded-full bg-mint-400/10 blur-3xl" />
            <div className="absolute inset-0 bg-grid-faint opacity-40" />
          </div>

          <div className="relative flex h-full flex-col px-5 py-6 sm:px-10">
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-mint-300 to-forest-500"><Leaf className="h-5 w-5 text-white" /></span>
                <span className="font-display text-lg font-bold text-white">GreenVest Demo</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-mint-200">
                DEMO {String(step + 1).padStart(2, "0")} / {phases.length}
              </div>
            </div>

            {/* progress chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {CHIP.map((c, i) => (
                <button key={c} onClick={() => go(i)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${i < step ? "bg-white/15 text-white" : i === step ? "bg-mint-400 text-forest-950" : "bg-white/5 text-forest-300"}`}>
                  {c}
                </button>
              ))}
            </div>

            {/* stage */}
            <div className="flex flex-1 items-center justify-center">
              <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2 lg:items-center">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.45 }} className="space-y-3">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-mint-300">
                      <Landmark className="h-4 w-4" /> Step {step + 1}
                    </p>
                    <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">{p.title}</h2>
                    <p className="max-w-md text-[15px] leading-relaxed text-forest-200/80">{p.body}</p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }}
                    className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
                    <p.Visual />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* control bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <motion.div className="h-1 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full bg-mint-300" animate={{ width: `${((step + (paused ? 1 : 0.5)) / phases.length) * 100}%` }} transition={{ duration: 0.3 }} />
              </motion.div>
              <div className="flex items-center gap-2">
                <button onClick={() => onClose()} className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"><X className="h-4 w-4" /></button>
                <button onClick={() => go(0)} className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"><RotateCcw className="h-4 w-4" /></button>
                <button onClick={() => setPaused((x) => !x)} className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                {step < phases.length - 1 ? (
                  <button onClick={next} className="inline-flex items-center gap-1.5 rounded-xl bg-mint-400 px-4 py-2 text-sm font-semibold text-forest-950 hover:bg-mint-300">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  step === phases.length - 1 ? (
                    <Link to="/signup" onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl bg-mint-400 px-4 py-2 text-sm font-semibold text-forest-950 hover:bg-mint-300">
                      Explore Full Analysis <SkipForward className="h-4 w-4" />
                    </Link>
                  ) : null
                )}
              </div>
            </div>

            <p className="mt-3 text-center text-[11px] text-forest-300/70">Prototype data — illustrative estimates, not guarantees.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
