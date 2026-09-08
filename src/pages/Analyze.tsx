import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Ruler, Layers, CloudRain, Droplets, Wallet, Target, ChevronRight, Sparkles, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { AnalysisLoader } from "@/components/engines/AnalysisLoader";
import { RAINFALL_OPTIONS, SOIL_TYPES } from "@/data/plantations";
import { useSimulation } from "@/context/SimulationContext";
import { defaultLandInput } from "@/context/SimulationContext";
import { useToast } from "@/context/ToastContext";
import { persistAnalysis } from "@/services/supabaseData";
import { buildStrategies, validateLandInput } from "@/logic/engine";
import { pickRecommended } from "@/logic/recommend";
import type { LandInput } from "@/logic/types";

export default function AnalyzePage() {
  const sim = useSimulation();
  const toast = useToast();
  const nav = useNavigate();
  const base = defaultLandInput();
  const rainPrefill = RAINFALL_OPTIONS[1];

  const [d, setD] = useState({
    location: "Coimbatore, Tamil Nadu",
    area: "25",
    soil: "Sandy Loam",
    rainfallLabel: rainPrefill.label,
    waterLabel: base.waterLabel,
    budget: "1500000",
    goal: "balanced" as LandInput["goal"],
  });
  const [phase, setPhase] = useState<"form" | "loading">("form");
  const [warning, setWarning] = useState<string | null>(null);

  const waterMap = { Limited: "limited", Seasonal: "seasonal", Adequate: "adequate", Abundant: "abundant" } as const;
  const rainfallOption = (label: string) =>
    RAINFALL_OPTIONS.find((option) => option.label === label) ?? RAINFALL_OPTIONS[1];

  function validate(): string | null {
    if (!d.location.trim()) return "Please enter the land location (e.g. Coimbatore, Tamil Nadu).";
    const area = Number(d.area);
    if (!area || area <= 0) return "Please enter a valid land area in acres.";
    if (area > 2000) return "That area is unusually large for this prototype — please enter between 1–2000 acres.";
    const budget = Number(d.budget) || 0;
    if (budget < 500000) return "This budget looks insufficient. Consider a smaller pilot plot or raising the investment.";
    return null;
  }

  function analyze() {
    const err = validate();
    if (err) {
      setWarning(err);
      return;
    }
    setWarning(null);
    setPhase("loading");
    // hand-off target: Phase-3 swaps this for a real Decision Engine call.
  }

  async function finish() {
    const validation = validateLandInput(buildLand() as unknown as Record<string, unknown>);
    if (!validation.valid || !validation.data) {
      setWarning(validation.issues[0]?.message || "We need valid land inputs before creating a scenario.");
      setPhase("form");
      return;
    }
    const land = validation.data;
    const strategies = buildStrategies(land);
    const selected = pickRecommended(strategies);
    sim.commitLand(land);
    const saved = await persistAnalysis(land, strategies, selected.id);
    if (saved.source === "unavailable") {
      toast.push(saved.error || "Unable to save your analysis. Please try again.", "error");
    } else {
      sim.setAnalysisId(saved.data.id);
      toast.push(saved.source === "supabase" ? "Analysis saved" : "Analysis saved in Demo Mode.", saved.source === "supabase" ? "success" : "info");
    }
    nav("/dashboard");
  }

  function buildLand(): LandInput {
    const ll = defaultLandInput();
    return {
      ...ll,
      location: d.location,
      area: Math.max(1, Number(d.area) || 25),
      soil: d.soil,
      rainfallKey: rainfallOption(d.rainfallLabel).key as LandInput["rainfallKey"],
      rainfallLabel: rainfallOption(d.rainfallLabel).label,
      rainfallMm: rainfallOption(d.rainfallLabel).representativeAnnualMm,
      waterKey: waterMap[d.waterLabel as keyof typeof waterMap] ?? "limited",
      waterLabel: d.waterLabel,
      budgetLakhs: Math.max(0, (Number(d.budget) || 1500000) / 100000),
      goal: d.goal,
    };
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        icon={MapPin}
        eyebrow="Step 1 — input"
        title="Analyze Your Land"
        description="Tell us about your land and goal. GreenVest combines reference-based screening with transparent scenario estimates to compare three strategies."
      />

      <GlassCard className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {phase === "form" ? (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={(e) => {
                e.preventDefault();
                analyze();
              }}
              className="grid gap-5 sm:grid-cols-2"
            >
              <Field icon={MapPin} label="Location">
                <input value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} className="input" required />
              </Field>
              <Field icon={Ruler} label="Land Area">
                <div className="relative">
                  <input value={d.area} type="number" min={1} onChange={(e) => setD({ ...d, area: e.target.value })} className="input pr-14" required />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">acres</span>
                </div>
              </Field>
              <Field icon={Layers} label="Soil Type">
                <select value={d.soil} onChange={(e) => setD({ ...d, soil: e.target.value })} className="input">
                  {SOIL_TYPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field icon={CloudRain} label="Annual Rainfall Scenario">
                <div>
                  <select value={d.rainfallLabel} onChange={(e) => setD({ ...d, rainfallLabel: e.target.value })} className="input">
                    {RAINFALL_OPTIONS.map((rain) => (
                      <option key={rain.key}>{rain.label}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">Representative scenario input only; rainfall can vary within a district, season and year.</p>
                </div>
              </Field>
              <Field icon={Droplets} label="Water Availability">
                <select value={d.waterLabel} onChange={(e) => setD({ ...d, waterLabel: e.target.value })} className="input">
                  {["Limited", "Seasonal", "Adequate", "Abundant"].map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </Field>
              <Field icon={Wallet} label="Investment Budget">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-medium text-forest-700">₹</span>
                  <input value={d.budget} inputMode="numeric" onChange={(e) => setD({ ...d, budget: e.target.value.replace(/[^0-9]/g, "") })} className="input pl-8" />
                </div>
              </Field>

              <div className="sm:col-span-2">
                <Field icon={Target} label="Primary Goal">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(["balanced", "carbon", "return"] as const).map((g) => {
                      const meta =
                        g === "carbon"
                          ? { t: "Max Carbon", d: "Prioritize scenario carbon" }
                          : g === "return"
                            ? { t: "Max Return", d: "Prioritize scenario finance" }
                            : { t: "Balanced", d: "Carbon + finance + feasibility" };
                      const act = d.goal === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setD({ ...d, goal: g })}
                          className={`rounded-xl border p-3 text-left transition-all ${act ? "border-forest-600 bg-forest-600 text-white shadow-md" : "border-slate-900/10 bg-white text-slate-700 hover:border-forest-600/40"}`}
                        >
                          {act && <Sparkles className="mb-1 h-4 w-4 text-mint-300" />}
                          <p className="font-semibold">{meta.t}</p>
                          <p className={`text-xs ${act ? "text-forest-100" : "text-slate-400"}`}>{meta.d}</p>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>

              <AnimatePresence>
                {warning && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:col-span-2"
                  >
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {warning}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between border-t border-dashed border-slate-900/10 pt-5 sm:col-span-2">
                <span className="text-xs text-slate-400">Agricultural screening is reference-based; carbon, finance and performance figures are scenario estimates.</span>
                <AnimatedButton type="submit" size="lg">
                  Analyze My Land
                  <ChevronRight className="h-4 w-4" />
                </AnimatedButton>
              </div>
            </motion.form>
          ) : (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalysisLoader onDone={finish} />
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );

  function Field({ icon: Ic, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
    return (
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-forest-900">
          <Ic className="h-4 w-4 text-forest-600" />
          {label}
        </span>
        {children}
      </label>
    );
  }
}
