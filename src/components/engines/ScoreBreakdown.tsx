import { motion } from "framer-motion";
import type { ScoreMetrics } from "@/logic/types";
import { dimensionRows } from "@/logic/engine";
import { CountUp } from "@/components/ui/CountUp";

export function ScoreBreakdown({ m }:{ m: ScoreMetrics }) {
  const rows = dimensionRows(m);
  return (
    <div className="space-y-3.5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-forest-600">GreenVest Score</p>
          <div className="flex items-baseline gap-1 font-display">
            <CountUp value={m.total} className="text-5xl font-semibold tracking-tight text-forest-950" />
            <span className="text-xl font-medium text-forest-400">/100</span>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.7, repeat: 2, repeatDelay: 1.2 }}
          className="rounded-xl bg-mint-100 px-3 py-1.5 text-sm font-bold text-forest-800"
        >
          {m.total >= 80 ? "Strong" : m.total >= 60 ? "Feasible" : "Fragile"}
        </motion.div>
      </div>

      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-xs font-medium leading-tight text-slate-500">{r.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-forest-900/8">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-forest-600 to-mint-400"
                initial={{ width: 0 }}
                animate={{ width: `${r.value}%` }}
                transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="w-8 text-right text-xs font-semibold tabular-nums text-forest-800">
              <CountUp value={r.value} />
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-slate-400">Normalized model signals for comparing scenarios; not field measurements or probabilities.</p>
    </div>
  );
}
