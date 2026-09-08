import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/utils/cn";

export function ChartCard({
  title,
  subtitle,
  legend,
  children,
  className,
  actions,
}: {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <GlassCard
      className={cn("flex flex-col p-5 md:p-6", className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight text-forest-950">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {legend}
          {actions}
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </GlassCard>
  );
}
