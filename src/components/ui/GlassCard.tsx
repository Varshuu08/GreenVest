import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import type { HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  /** true = light glass for cards-on-canvas, false = floating dark glass */
  dark?: boolean;
  interactive?: boolean;
  hoverElevate?: boolean;
}

/**
 * Reusable translucent rounded card with a soft border + shadow.
 * Behaves like an <motion.div>, so layout/whileHover work directly.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, dark = false, interactive = false, hoverElevate = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        {...props}
        className={cn(
          "rounded-2xl border shadow-sm",
          dark
            ? "glass-dark shadow-black/20"
            : "border-slate-900/5 bg-white/80 shadow-[0_10px_40px_-18px_rgba(6,30,20,0.35)] backdrop-blur-md",
          hoverElevate &&
            "transition-[transform,box-shadow] duration-300 will-change-transform hover:-translate-y-1 hover:shadow-[0_26px_60px_-28px_rgba(6,30,20,0.5)]",
          interactive && "cursor-pointer",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
