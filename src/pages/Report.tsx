import { useEffect, useState } from "react";
import { FileText, Download, Leaf, Coins, Wind, ShieldCheck, Printer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { useSimulation } from "@/context/SimulationContext";
import { NeedInputCard } from "@/components/engines/StatusBits";
import { rationaleFor } from "@/logic/recommend";
import { useToast } from "@/context/ToastContext";
import { loadReports, persistAnalysis, persistReport } from "@/services/supabaseData";
import type { SavedReport } from "@/services/supabaseData";

export default function ReportPage() {
  const sim = useSimulation();
  const toast = useToast();
  const [print] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    void loadReports().then((result) => {
      setReports(result.data.slice(0, 4));
      if (result.source === "unavailable") toast.push(result.error || "Unable to load saved reports.", "error");
    });
  }, [toast]);

  if (!sim.analyzed || !sim.active) return <NeedInputCard />;
  const a = sim.active;
  const L = sim.land;

  async function saveReport() {
    setSaving(true);
    let analysisId = sim.analysisId;
    if (!analysisId) {
      const saved = await persistAnalysis(L, sim.strategies, a.id, sim.scenario.name);
      if (saved.source === "unavailable") {
        setSaving(false);
        toast.push(saved.error || "Unable to save this analysis before saving a report.", "error");
        return;
      }
      analysisId = saved.data.id;
      sim.setAnalysisId(analysisId);
    }
    const result = await persistReport(analysisId, `${a.name} Investment Plan`, {
      land: L,
      strategy: a,
      scenario: sim.scenario.name,
      generatedAt: new Date().toISOString(),
    });
    setSaving(false);
    if (result.source === "unavailable") {
      toast.push(result.error || "Unable to save this report. Please try again.", "error");
      return;
    }
    const reportsResult = await loadReports();
    setReports(reportsResult.data.slice(0, 4));
    if (reportsResult.source === "unavailable") toast.push(reportsResult.error || "Unable to reload saved reports.", "error");
    toast.push(result.source === "supabase" ? "Investment report saved" : "Report saved in Demo Mode.", result.source === "supabase" ? "success" : "info");
  }

  return (
    <div className={`mx-auto max-w-4xl space-y-6 ${print ? "" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <PageHeader icon={FileText} eyebrow="Investment plan" title="GreenVest Investment Plan"
          description="A decision-support summary of your land analysis. All figures are simulated estimates." />
        <div className="flex gap-2">
          <AnimatedButton variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</AnimatedButton>
          <AnimatedButton onClick={() => void saveReport()} disabled={saving}><Download className="h-4 w-4" /> {saving ? "Saving Report..." : "Save Report"}</AnimatedButton>
        </div>
      </div>

      <div className="space-y-5 rounded-3xl border border-slate-900/5 bg-white p-7 shadow-sm print:border-forest-200">
        <header className="flex items-center justify-between border-b border-slate-900/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-forest-500 to-forest-800 text-white"><Leaf className="h-5 w-5" /></span>
            <span className="font-display text-xl font-bold text-forest-950">GreenVest Report</span>
          </div>
          <span className="text-xs text-slate-400">Prepared for {L.location}</span>
        </header>

        <Section title="1 · Land Summary">
          <Grid rows={[
            ["Location", L.location], ["Land Area", `${L.area} acres`], ["Soil", L.soil],
            ["Rainfall", L.rainfallLabel], ["Water availability", L.waterLabel], ["Budget", `₹${Math.round(L.budgetLakhs)}L`],
          ]} />
        </Section>

        <Section title="2 · Recommended Strategy">
          <Grid rows={[
            ["Strategy", `${a.code}. ${a.name}`], ["Tagline", a.tagline], ["GreenVest Score", `${a.metrics.total}/100`],
            ["Recommended", "Yes — best overall balance"],
          ]} />
          <p className="mt-3 pl-1 text-sm text-slate-600">
            <b className="text-forest-900">Why:</b> {rationaleFor(a, L)}
          </p>
        </Section>

        <Section title="3 · Environmental Impact" icon={Leaf}>
          <Grid rows={[["Scenario Carbon Estimate (10yr)", `${a.carbonBudgetT} tCO₂`], ["Modeled Biodiversity Score", `${a.metrics.biodiversity}/100`], ["Modeled Water Requirement", `${Math.round(a.waterRequiredUnits)} index units (availability index ${Math.round(L.availableWaterUnits)})`]]} />
        </Section>

        <Section title="4 · Financial Outlook" icon={Coins}>
          <Grid rows={[["Initial investment assumption", `₹${Math.round(a.initCostL)}L`], ["Maintenance assumption / acre-yr", `₹${Math.round(a.maintCostLyr * 100) / 100}L`], ["Scenario Financial Estimate (10yr)", a.returnShort]]} />
        </Section>

        <Section title="5 · Scenario Sensitivity" icon={Wind}>
          <Grid rows={[["Climate sensitivity", a.irreRisk], ["Water-fit sensitivity", a.waterRequiredUnits > L.availableWaterUnits ? "Elevated in model" : "Lower in model"], ["Market sensitivity", a.key === "return" ? "Higher model sensitivity" : "Moderate model sensitivity"], ["Modeled Biodiversity Score", `${a.metrics.biodiversity}/100 · not a field survey`]]} />
        </Section>

        <Section title="6 · Scenario Outlook">
          <Grid rows={[["Normal", `${a.metrics.total}/100 modeled score`], ["Drier / Hotter", "Illustrative stress assumptions adjust modeled growth, water and financial inputs"], ["Worst-case", sim.outcome && sim.outcome.feasible ? "Within model threshold" : "Model suggests adjustment"]]} />
        </Section>

        <Section title="7 · Final Recommendation" icon={ShieldCheck}>
          <p className="text-sm leading-relaxed text-slate-600">
            GreenVest recommends <b className="text-forest-900">{a.name}</b> for your {L.area}-acre plot. {rationaleFor(a, L)}
          </p>
        </Section>

        <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          <b>Assumptions & limitations:</b> Agricultural suitability statements use reference-based screening and rule-based reasoning. Carbon, financial return, maintenance, water, biodiversity, resilience and risk figures are scenario estimates, not guarantees. Validate site-specific soil testing, drainage, water availability, cultivar or clone choice, local climate records and current market prices before capital is committed.
        </div>

        <div className="text-center">
          <ComingSoonBadge label="Full printable export — coming in next stage (demo data)" />
        </div>
      </div>

      {reports.length > 0 && (
        <div className="print:hidden">
          <h2 className="font-display text-lg font-semibold text-forest-950">Previously Generated Reports</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl border border-slate-900/5 bg-white/80 px-4 py-3 shadow-sm">
                <p className="font-semibold text-forest-950">{report.name}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()} · Saved investment plan</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function Section({ title, icon: Ic, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
    return (
      <div className="border-b border-slate-900/5 py-4 last:border-0">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-forest-900">{Ic && <Ic className="h-4 w-4 text-forest-600" />}{title}</h3>
        <div className="mt-2">{children}</div>
      </div>
    );
  }
  function Grid({ rows }: { rows: [string, string][] }) {
    return (
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-slate-900/5 py-1.5 text-sm">
            <dt className="text-slate-400">{k}</dt>
            <dd className="font-medium text-forest-950">{v}</dd>
          </div>
        ))}
      </dl>
    );
  }
}
