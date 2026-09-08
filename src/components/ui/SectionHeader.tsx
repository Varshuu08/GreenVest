import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { fade, rise, stagger } from "@/lib/variants";

export function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={stagger(0.12, 0)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className={cn("flex flex-wrap items-end justify-between gap-4", className)}
    >
      <motion.div variants={rise} className="max-w-2xl">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-forest-600">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{eyebrow}</span>
          </div>
        )}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-forest-950 md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{description}</p>
        )}
      </motion.div>
      {action && <motion.div variants={fade}>{action}</motion.div>}
    </motion.div>
  );
}
