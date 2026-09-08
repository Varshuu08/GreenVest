import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, Trash2, Copy, ExternalLink, MapPin, Trees, Coins, Landmark } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/context/ToastContext";
import { useSimulation } from "@/context/SimulationContext";
import type { SavedAnalysis } from "@/lib/repo";
import { loadAnalyses, loadAnalysis, persistAnalysis, removeAnalysis } from "@/services/supabaseData";

export default function AnalysesPage() {
  const sim = useSimulation();
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    const result = await loadAnalyses();
    setRows(result.data);
    setUsingDemo(result.source === "demo");
    setLoadError(result.source === "unavailable" ? result.error || "Unable to load your analyses. Please try again." : "");
    setLoading(false);
  }
  async function doOpen(r: SavedAnalysis) {
    const result = await loadAnalysis(r.id);
    if (!result.data) {
      toast.push("Unable to load this analysis. Please try again.", "error");
      return;
    }
    const analysis = result.data;
    sim.commitLand(analysis.land);
    sim.setAnalysisId(analysis.id);
    sim.selectStrategy(analysis.strategyId);
    if (analysis.zoning) sim.setZoning(analysis.zoning);
    toast.push(`Opening ${analysis.recommendedName} (${analysis.land.location})…`, "info");
    navigate("/dashboard");
  }

  async function duplicate(r: SavedAnalysis) {
    const result = await persistAnalysis(r.land, r.strategies, r.strategyId);
    if (result.source === "unavailable") {
      toast.push(result.error || "Unable to duplicate this analysis. Please try again.", "error");
      return;
    }
    await refresh();
    toast.push(result.source === "supabase" ? "Analysis duplicated" : "Analysis duplicated in Demo Mode.", "success");
  }

  async function remove(r: SavedAnalysis) {
    const result = await removeAnalysis(r.id);
    if (!result.data) {
      toast.push(result.error || "Unable to delete this analysis. Please try again.", "error");
      return;
    }
    await refresh();
    toast.push("Analysis deleted", "info");
  }

  const totalArea = rows.reduce((s, r) => s + r.land.area, 0);
  const totalCarbon = rows.reduce((s, r) => s + r.carbon, 0);
  const totalReturn = rows.reduce((s, r) => s + r.returnL, 0);
  const avgScore = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;

  const Kpis = [
    { l: "Land Analysed", v: `${rows.length}`, sub: "saved analyses", Icon: Landmark },
    { l: "Total Area", v: `${totalArea} ac`, sub: "aggregate acres", Icon: MapPin },
    { l: "Scenario Carbon Estimate", v: `${totalCarbon} t`, sub: "total modeled tCO₂", Icon: Trees },
    { l: "Scenario Financial Estimate", v: `₹${totalReturn}L`, sub: "modeled portfolio scenario", Icon: Coins },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <PageHeader icon={History} eyebrow="My GreenVest" title="Analyse History & Portfolio"
        description="Every saved land analysis is ready to reopen, duplicate or delete. Cloud records are scoped to your signed-in account." />

      {usingDemo && (
        <StatusBadge tone="mint" dot>DEMO MODE · Using your explicit local demo workspace</StatusBadge>
      )}
      {loadError && <p className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p>}

      {/* aggregate */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Kpis.map((k, i) => (
          <GlassCard key={k.l} className="p-5" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-900/5 text-forest-600"><k.Icon className="h-5 w-5" /></span>
            <p className="mt-3 text-sm text-slate-400">{k.l}</p>
            <p className="font-display text-2xl font-semibold text-forest-950">{k.v}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </GlassCard>
        ))}
      </div>

      {/* portfolio score strip */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-500 to-forest-800 font-display text-xl font-bold text-white">
            {avgScore || "--"}
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-forest-950">Average GreenVest Score</p>
            <p className="text-sm text-slate-500">Across {rows.length} saved analysis{rows.length === 1 ? "" : "es"}</p>
          </div>
        </div>
        {rows.length > 0 && <StatusBadge tone="emerald" icon={Trees}>Portfolio view ready</StatusBadge>}
      </GlassCard>

      {/* saved list */}
      {loading ? (
        <GlassCard className="grid min-h-48 place-items-center p-12 text-center">
          <p className="text-sm text-slate-500">Loading your saved analyses…</p>
        </GlassCard>
      ) : rows.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center p-12 text-center">
          <History className="mb-3 h-10 w-10 text-forest-300" />
          <h3 className="font-display text-lg font-semibold text-forest-950">No saved analyses yet</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">Run an analysis, then press “Save Analysis” on your dashboard or strategy view to persist it here.</p>
          <Link to="/analyze" className="mt-5 text-forest-700"><span className="rounded-xl bg-forest-600 px-4 py-2 text-sm font-semibold text-white">Analyze land</span></Link>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-forest-950">{r.land.location}</p>
                    <p className="text-sm text-slate-500">{r.recommendedName}</p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-mint-100 px-2.5 py-1 font-display font-bold text-forest-800">{r.score}/100</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>{r.land.area} acres</span>
                  <span className="text-forest-700">Scenario: {r.carbon} tCO₂</span>
                  <span className="text-amber-600">Scenario: ₹{r.returnL}L</span>
                  <span className="text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => void doOpen(r)} className="inline-flex items-center gap-1.5 rounded-lg bg-forest-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-forest-700"><ExternalLink className="h-3.5 w-3.5" /> View Analysis</button>
                  <button onClick={() => void duplicate(r)} className="inline-flex items-center gap-1.5 rounded-lg bg-forest-50 px-3 py-1.5 text-sm text-forest-700 hover:bg-forest-100"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                  <button onClick={() => void remove(r)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
