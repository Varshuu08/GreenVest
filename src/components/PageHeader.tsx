import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { rise, stagger } from "@/lib/variants";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={stagger(0.12, 0.05)}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <motion.div variants={rise} className="flex flex-wrap items-center gap-3">
        {Icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900/5 text-forest-700">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-600">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl font-semibold tracking-tight text-forest-950 md:text-4xl">
            {title}
          </h1>
        </div>
        <StatusBadge tone="mint" dot className="ml-auto">
          Demo Build
        </StatusBadge>
      </motion.div>
      {description && (
        <motion.p variants={rise} className="max-w-2xl text-[15px] leading-relaxed text-slate-500">
          {description}
        </motion.p>
      )}
      {children && <motion.div variants={rise}>{children}</motion.div>}
    </motion.div>
  );
}
