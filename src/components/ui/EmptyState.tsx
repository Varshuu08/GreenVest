import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { rise, stagger } from "@/lib/variants";

export function EmptyState({
  icon: Icon,
  title,
  description,
  note,
  footer,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  note: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={stagger(0.12, 0)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className={className}
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-900/5 bg-white/80 backdrop-blur-md shadow-[0_10px_40px_-18px_rgba(6,30,20,0.3)]">
        {/* soft radial wash */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-mint-200/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-forest-200/40 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.5]" />
        </div>

        <div className="relative flex flex-col items-center px-6 py-16 text-center md:py-20">
          <motion.div variants={rise} className="relative mb-6">
            <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-3xl bg-forest-300/40" />
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-forest-600 to-forest-900 text-white shadow-[0_18px_40px_-16px_rgba(15,65,42,0.6)]">
              <Icon className="h-9 w-9" strokeWidth={1.7} />
            </span>
          </motion.div>

          <motion.h3 variants={rise} className="font-display text-2xl font-semibold tracking-tight text-forest-950">
            {title}
          </motion.h3>
          <motion.p variants={rise} className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            {description}
          </motion.p>

          <motion.div variants={rise} className="mt-6">
            <ComingSoonBadge />
          </motion.div>

          <motion.p variants={rise} className="mt-5 max-w-md rounded-xl border border-forest-900/5 bg-forest-50/60 px-4 py-3 text-xs leading-relaxed text-forest-800/70">
            {note}
          </motion.p>

          {footer && <motion.div variants={rise} className="mt-7">{footer}</motion.div>}
        </div>
      </div>
    </motion.div>
  );
}
