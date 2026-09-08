import { cn } from "@/utils/cn";
import type { LucideIcon } from "lucide-react";

type Tone = "mint" | "emerald" | "forest" | "amber" | "slate" | "sky" | "violet";

const tones: Record<Tone, string> = {
  mint: "text-forest-700 bg-mint-100/70 border-mint-300/60",
  emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
  forest: "text-forest-100 bg-forest-700/90 border-forest-600",
  amber: "text-amber-700 bg-amber-50 border-amber-200",
  sky: "text-sky-700 bg-sky-50 border-sky-200",
  violet: "text-violet-700 bg-violet-50 border-violet-200",
  slate: "text-slate-600 bg-slate-100 border-slate-200",
};

export function StatusBadge({
  tone = "slate",
  icon: Icon,
  children,
  dot = false,
  className,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-tight",
        tones[tone],
        className
      )}
    >
      {dot && <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>}
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}
