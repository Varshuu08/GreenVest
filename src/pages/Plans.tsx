import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";

const plans = [
  {
    name: "Free", price: "₹0", cadence: "forever", tag: "Baseline",
    features: ["1 land analysis", "Basic recommendation", "Single saved scenario", "Core scoring"],
  },
  {
    name: "Pro", price: "₹999", cadence: "/ land analysis", hot: true,
    features: ["Unlimited analyses", "Advanced scenario simulator", "Climate stress testing", "Detailed investment reports", "Portfolio view", "Save scenarios"],
  },
  {
    name: "Enterprise", price: "Custom", cadence: "annual", tag: "Teams",
    features: ["Multi-user access", "Portfolio intelligence", "API access", "Advanced analytics", "Priority support"],
  },
];

export default function PlansPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader icon={Sparkles} eyebrow="GreenVest" title="Plans"
        description="Start free. Upgrade when you manage more land. Payments are disabled in this build — tiers are for demonstration." />

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((p) => (
          <GlassCard key={p.name} className={`p-6 ${p.hot ? "border-forest-600 ring-2 ring-forest-600/20 bg-gradient-to-b from-forest-50 to-white" : ""}`}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            {p.hot && <span className="mb-2 inline-block rounded-full bg-forest-600 px-2.5 py-0.5 text-[11px] font-bold text-white">MOST POPULAR</span>}
            <h3 className="font-display text-xl font-semibold text-forest-950">{p.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{p.tag ?? "Individual"}</p>
            <p className="mt-4 font-display text-3xl font-semibold text-forest-950">{p.price} <span className="text-sm font-normal text-slate-400">{p.cadence}</span></p>
            <ul className="mt-5 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full ${p.hot ? "bg-forest-600 text-white" : "bg-mint-100 text-forest-700"}`}><Check className="h-3 w-3" /></span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              {p.name === "Free" ? (
                <Link to="/dashboard" className="text-white"><AnimatedButton variant="secondary" className="w-full">Continue with Free</AnimatedButton></Link>
              ) : (
                <AnimatedButton variant={p.hot ? "primary" : "secondary"} className="w-full"><span className="inline-flex items-center gap-2">Choose {p.name}</span></AnimatedButton>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex justify-center">
        <ComingSoonBadge label="Payments & in-app billing — coming in a future stage" />
      </div>
    </div>
  );
}
