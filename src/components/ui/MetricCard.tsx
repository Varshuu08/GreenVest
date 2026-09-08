import type { LucideIcon } from "lucide-react";
import { memo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CountUp } from "@/components/ui/CountUp";

/** Formats a counting number with the provided grouping + optional decimals. */
function formatNumber(v: number, decimals: number) {
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon: Icon,
  hint,
  tone,
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: LucideIcon;
  hint?: string;
  demo?: boolean;
  tone?: "emerald" | "forest" | "amber" | "mint";
  delay?: number;
}) {
  const chip =
    tone === "amber"
      ? "bg-amber-100 text-amber-600"
      : tone === "forest"
        ? "bg-forest-900/5 text-forest-700"
        : tone === "mint"
          ? "bg-mint-100/70 text-forest-700"
          : "bg-emerald-100 text-emerald-700";

  return (
    <GlassCard
      data-role="metric"
      className="group flex flex-col p-5"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${chip}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-0.5">
        {prefix && <span className="font-display text-2xl font-semibold text-slate-900">{prefix}</span>}
        <CountUp
          value={value}
          decimals={decimals}
          format={(v) => formatNumber(v, decimals)}
          className="font-display text-4xl font-semibold tracking-tight text-forest-950 tabular-nums"
        />
        {suffix && <span className="ml-1 text-sm font-medium text-slate-400">{suffix}</span>}
      </div>

      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </GlassCard>
  );
});
