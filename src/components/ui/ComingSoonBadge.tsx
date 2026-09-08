import { Sparkles } from "lucide-react";

export function ComingSoonBadge({ label = "Coming in next stage" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-900/10 bg-white/70 px-3 py-1 text-xs font-semibold tracking-tight text-forest-700 shadow-sm backdrop-blur">
      <Sparkles className="h-3.5 w-3.5 text-mint-400" />
      {label}
    </span>
  );
}
